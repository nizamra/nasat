import json
import uuid

from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import User, SocialLink, Relation
from django.conf import settings

User = get_user_model()


class RelatedPersonSerializer(serializers.Serializer):
    """A simple person created together with the main user."""
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(
        max_length=150, required=False, allow_blank=True, default="")
    sex = serializers.ChoiceField(
        choices=User.SEX_CHOICES, required=False, allow_blank=True, default="")
    relation_type = serializers.ChoiceField(choices=Relation.RELATION_TYPES)

    def validate(self, attrs):
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
            )  # no password -> unusable password, cannot log in
            # Relation.save() creates the reverse relation automatically.
            Relation.objects.create(
                from_user=user,
                to_user=related,
                relation_type=person["relation_type"],
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
        fields = ['id', 'username', 'first_name', 'last_name', 'sex', 'avatar']

    def get_avatar(self, obj):
        if not obj.avatar:
            return None
        avatar_path = str(obj.avatar)
        base_url = "http://staging.nasat.local"
        bucket = settings.AWS_STORAGE_BUCKET_NAME or 'nasat-media'
        return f"{base_url}/media/{bucket}/{avatar_path}"


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

    class Meta:
        model = Relation
        fields = ['id', 'to_user', 'to_user_id', 'relation_type', 'created_at']
        read_only_fields = ['created_at']


class UserSerializer(serializers.ModelSerializer):
    social_links = SocialLinkSerializer(many=True, read_only=True)
    relations_from = RelationSerializer(many=True, read_only=True)
    avatar = serializers.SerializerMethodField()
    age = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'title', 'bio', 'location',
            'avatar', 'is_verified', 'birth_date', 'age', 'date_joined',
            'social_links', 'first_name', 'last_name', 'sex',
            'relations_from'
        ]

    def get_avatar(self, obj):
        if not obj.avatar:
            return None

        # Get the raw path from the avatar field (stored in DB as 'avatars/...')
        avatar_path = str(obj.avatar)
        # print(f"[DEBUG] Raw avatar path: {avatar_path}")

        # Construct URL using the Ingress path (no port, uses /media prefix)
        base_url = "http://staging.nasat.local"
        bucket = settings.AWS_STORAGE_BUCKET_NAME or 'nasat-media'

        # Build URL that goes through the Ingress /media path
        full_url = f"{base_url}/media/{bucket}/{avatar_path}"

        # print(f"[DEBUG] Constructed full URL: {full_url}")
        return full_url
