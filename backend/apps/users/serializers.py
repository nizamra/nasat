import json
import uuid
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Allergy, Education, EmergencyContact, HealthItem, LifeEvent, PersonAlias,
    PersonDevice, PersonInterest, PersonLanguage, PersonNote, Pet,
    User, SocialLink, Relation,
)
from django.conf import settings

User = get_user_model()


class NullableIntegerField(serializers.IntegerField):
    """Accept empty multipart form values for nullable numeric fields."""

    def run_validation(self, data=serializers.empty):
        return super().run_validation(None if data == "" else data)


class NullableDecimalField(serializers.DecimalField):
    """Accept empty multipart form values for nullable numeric fields."""

    def run_validation(self, data=serializers.empty):
        return super().run_validation(None if data == "" else data)


class NullableDateField(serializers.DateField):
    """Accept empty multipart form values for nullable date fields."""

    def run_validation(self, data=serializers.empty):
        return super().run_validation(None if data == "" else data)


class RelatedPersonSerializer(serializers.Serializer):
    """A simple person created together with the main user."""
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(
        max_length=150, required=False, allow_blank=True, default="")
    sex = serializers.ChoiceField(
        choices=User.SEX_CHOICES, required=False, allow_blank=True, default="")
    height_cm = NullableIntegerField(
        required=False, allow_null=True, min_value=1, max_value=32767)
    weight_kg = NullableDecimalField(
        required=False, allow_null=True, max_digits=5, decimal_places=1,
        min_value=Decimal("0.1"))
    relation_type = serializers.ChoiceField(choices=Relation.RELATION_TYPES)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    date_precision = serializers.ChoiceField(
        choices=User.DATE_PRECISION_CHOICES, required=False, default='exact')

    def validate(self, attrs):
        if attrs.get("start_date") and attrs.get("end_date") and attrs["end_date"] < attrs["start_date"]:
            raise serializers.ValidationError("Relationship end date must be on or after its start date.")
        implied = Relation.IMPLIED_SEX.get(attrs["relation_type"])
        sex = attrs.get("sex", "")
        if implied:
            if sex and sex != implied:
                raise serializers.ValidationError(
                    f"'{attrs['relation_type']}' implies sex '{implied}', got '{sex}'.")
            attrs["sex"] = implied
        return attrs


class RelationsInputField(serializers.Field):
    """List of RelatedPersonSerializer items.

    Accepts a real list (JSON body) or a JSON string (multipart form data).
    """

    def to_internal_value(self, data):
        if isinstance(data, str):
            if not data.strip():
                return []
            try:
                data = json.loads(data)
            except ValueError:
                raise serializers.ValidationError("Invalid JSON.")
        if not isinstance(data, list):
            raise serializers.ValidationError("Expected a list of relations.")
        child = RelatedPersonSerializer(data=data, many=True)
        child.is_valid(raise_exception=True)
        return child.validated_data

    def to_representation(self, value):
        return value


def _unique_username(first_name, last_name):
    base = slugify(f"{first_name} {last_name}").replace("-", "") or "user"
    base = base[:20]
    while True:
        candidate = f"{base}_{uuid.uuid4().hex[:6]}"
        if not User.objects.filter(username=candidate).exists():
            return candidate


class RegisterSerializer(serializers.ModelSerializer):
    relations = RelationsInputField(write_only=True, required=False)
    height_cm = NullableIntegerField(
        required=False, allow_null=True, min_value=1, max_value=32767)
    weight_kg = NullableDecimalField(
        required=False, allow_null=True, max_digits=5, decimal_places=1,
        min_value=Decimal("0.1"))
    birth_date = NullableDateField(required=False, allow_null=True)
    death_date = NullableDateField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "sex",
            "title",
            "bio",
            "location",
            "birth_date",
            "birth_date_precision",
            "death_date",
            "death_date_precision",
            "place_of_birth",
            "current_city",
            "height_cm",
            "weight_kg",
            "avatar",
            "relations",
        ]
        read_only_fields = ["id"]
        # username is optional: it is generated when left empty
        extra_kwargs = {"username": {"required": False, "allow_blank": True}}

    @transaction.atomic
    def create(self, validated_data):
        relations = validated_data.pop("relations", [])
        if not validated_data.get("username"):
            validated_data["username"] = _unique_username(
                validated_data.get("first_name", ""),
                validated_data.get("last_name", ""),
            )
        # No password is passed -> create_user stores an unusable password
        user = User.objects.create_user(**validated_data)

        for person in relations:
            related = User.objects.create_user(
                username=_unique_username(
                    person["first_name"], person["last_name"]),
                first_name=person["first_name"],
                last_name=person["last_name"],
                sex=person["sex"],
                height_cm=person.get("height_cm"),
                weight_kg=person.get("weight_kg"),
            )  # no password -> unusable password, cannot log in
            # Relation.save() creates the reverse relation automatically.
            Relation.objects.create(
                from_user=user,
                to_user=related,
                relation_type=person["relation_type"],
                start_date=person.get("start_date"),
                end_date=person.get("end_date"),
                date_precision=person.get("date_precision", "exact"),
            )
        return user


class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLink
        fields = ['platform', 'url']


class RelationUserSerializer(serializers.ModelSerializer):
    """Minimal user serializer for relations"""
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'sex',
            'height_cm', 'weight_kg', 'avatar']

    def get_avatar(self, obj):
        if not obj.avatar:
            return None
        avatar_path = str(obj.avatar)
        request = self.context.get("request")
        if not request:
            return None
        bucket = settings.AWS_STORAGE_BUCKET_NAME or 'nasat-media'
        return request.build_absolute_uri(f"/media/{bucket}/{avatar_path}")


class BirthdaySerializer(RelationUserSerializer):
    """Minimal user info plus the data needed for a birthday schedule."""
    next_birthday = serializers.DateField(read_only=True)
    turning_age = serializers.SerializerMethodField()
    days_until = serializers.SerializerMethodField()

    class Meta(RelationUserSerializer.Meta):
        fields = RelationUserSerializer.Meta.fields + [
            'birth_date', 'next_birthday', 'turning_age', 'days_until']

    def get_turning_age(self, obj):
        return obj.next_birthday.year - obj.birth_date.year

    def get_days_until(self, obj):
        return (obj.next_birthday - timezone.localdate()).days


class RelationSerializer(serializers.ModelSerializer):
    to_user = RelationUserSerializer(read_only=True)
    to_user_id = serializers.IntegerField(write_only=True, required=False)
    # Optional edits to the related person, applied together with the relation
    first_name = serializers.CharField(
        write_only=True, required=False, max_length=150)
    last_name = serializers.CharField(
        write_only=True, required=False, allow_blank=True, max_length=150)
    sex = serializers.ChoiceField(
        choices=User.SEX_CHOICES, write_only=True, required=False,
        allow_blank=True)
    height_cm = NullableIntegerField(
        write_only=True, required=False, allow_null=True,
        min_value=1, max_value=32767)
    weight_kg = NullableDecimalField(
        write_only=True, required=False, allow_null=True,
        max_digits=5, decimal_places=1, min_value=Decimal("0.1"))

    class Meta:
        model = Relation
        fields = ['id', 'to_user', 'to_user_id', 'relation_type',
                  'start_date', 'end_date', 'date_precision', 'created_at',
                  'first_name', 'last_name', 'sex', 'height_cm', 'weight_kg']
        read_only_fields = ['created_at']

    def validate(self, attrs):
        start_date = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError("Relationship end date must be on or after its start date.")
        if self.instance is None:
            return attrs
        current_type = self.instance.relation_type
        new_type = attrs.get('relation_type', current_type)

        if new_type != current_type and Relation.objects.filter(
            from_user=self.instance.from_user,
            to_user=self.instance.to_user,
            relation_type=new_type,
        ).exists():
            raise serializers.ValidationError("This relation already exists.")

        # Only check sex/type consistency when one of them is being changed
        if 'relation_type' in attrs or 'sex' in attrs:
            sex = attrs.get('sex', self.instance.to_user.sex)
            implied = Relation.IMPLIED_SEX.get(new_type)
            if implied:
                if sex and sex != implied:
                    raise serializers.ValidationError(
                        f"'{new_type}' implies sex '{implied}', got '{sex}'.")
                attrs['sex'] = implied
        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        person = {k: validated_data[k]
                  for k in (
                      'first_name', 'last_name', 'sex', 'height_cm', 'weight_kg')
                  if k in validated_data}
        relation_fields = ('relation_type', 'start_date', 'end_date', 'date_precision')
        updates = {field: validated_data[field] for field in relation_fields
                   if field in validated_data}
        new_type = updates.get('relation_type', instance.relation_type)

        if new_type != instance.relation_type:
            instance.delete_reverse()  # old reverse; save() creates the new one
        if person:
            for field, value in person.items():
                setattr(instance.to_user, field, value)
            instance.to_user.save(update_fields=list(person))
        for field, value in updates.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class UserSerializer(serializers.ModelSerializer):
    social_links = SocialLinkSerializer(many=True, read_only=True)
    relations_from = RelationSerializer(many=True, read_only=True)
    avatar = serializers.SerializerMethodField()
    age = serializers.IntegerField(read_only=True)
    birth_date = NullableDateField(required=False, allow_null=True)
    death_date = NullableDateField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'title', 'bio', 'location',
            'avatar', 'is_verified', 'birth_date', 'age', 'date_joined',
            'birth_date_precision', 'death_date', 'death_date_precision',
            'place_of_birth', 'current_city',
            'social_links', 'first_name', 'last_name', 'sex',
            'height_cm', 'weight_kg',
            'relations_from',
        ]

    def get_avatar(self, obj):
        if not obj.avatar:
            return None

        # Get the raw path from the avatar field (stored in DB as 'avatars/...')
        avatar_path = str(obj.avatar)
        # print(f"[DEBUG] Raw avatar path: {avatar_path}")

        request = self.context.get("request")
        if not request:
            return None
        bucket = settings.AWS_STORAGE_BUCKET_NAME or 'nasat-media'
        return request.build_absolute_uri(f"/media/{bucket}/{avatar_path}")


class PersonRecordSerializer(serializers.ModelSerializer):
    person = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())


class PersonAliasSerializer(PersonRecordSerializer):
    class Meta:
        model = PersonAlias
        fields = ['id', 'person', 'name', 'alias_type', 'notes']


class LifeEventSerializer(PersonRecordSerializer):
    class Meta:
        model = LifeEvent
        fields = ['id', 'person', 'title', 'event_date', 'date_precision',
                  'place', 'description', 'source_notes']


class PersonDeviceSerializer(PersonRecordSerializer):
    class Meta:
        model = PersonDevice
        fields = ['id', 'person', 'device_type', 'manufacturer', 'model', 'notes']


class PersonLanguageSerializer(PersonRecordSerializer):
    class Meta:
        model = PersonLanguage
        fields = ['id', 'person', 'language', 'proficiency', 'notes']


class EmergencyContactSerializer(PersonRecordSerializer):
    class Meta:
        model = EmergencyContact
        fields = ['id', 'person', 'name', 'relationship', 'phone', 'email', 'language']


class AllergySerializer(PersonRecordSerializer):
    class Meta:
        model = Allergy
        fields = ['id', 'person', 'category', 'allergen', 'severity', 'reaction', 'treatment']


class HealthItemSerializer(PersonRecordSerializer):
    class Meta:
        model = HealthItem
        fields = ['id', 'person', 'category', 'name', 'details']


class PetSerializer(PersonRecordSerializer):
    class Meta:
        model = Pet
        fields = ['id', 'person', 'name', 'species', 'breed', 'notes']


class EducationSerializer(PersonRecordSerializer):
    class Meta:
        model = Education
        fields = ['id', 'person', 'university', 'program', 'study_level', 'notes']


class PersonInterestSerializer(PersonRecordSerializer):
    class Meta:
        model = PersonInterest
        fields = ['id', 'person', 'category', 'name', 'details']


class PersonNoteSerializer(PersonRecordSerializer):
    class Meta:
        model = PersonNote
        fields = ['id', 'person', 'title', 'content', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
