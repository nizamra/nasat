from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import User, SocialLink, Relation
from django.conf import settings

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "title",
            "bio",
            "location",
            "birth_date",
            "avatar"
        ]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLink
        fields = ['platform', 'url']


class RelationUserSerializer(serializers.ModelSerializer):
    """Minimal user serializer for relations"""
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'avatar']

    def get_avatar(self, obj):
        if not obj.avatar:
            return None
        avatar_path = str(obj.avatar)
        base_url = "http://staging.nasat.local"
        bucket = settings.AWS_STORAGE_BUCKET_NAME or 'nasat-media'
        return f"{base_url}/media/{bucket}/{avatar_path}"


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

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'title', 'bio', 'location',
            'avatar', 'is_verified', 'birth_date', 'date_joined', 'social_links',
            'first_name', 'last_name', 'relations_from'
        ]

    def get_avatar(self, obj):
        if not obj.avatar:
            return None

        # Get the raw path from the avatar field (stored in DB as 'avatars/...')
        avatar_path = str(obj.avatar)
        print(f"[DEBUG] Raw avatar path: {avatar_path}")

        # Construct URL using the Ingress path (no port, uses /media prefix)
        base_url = "http://staging.nasat.local"
        bucket = settings.AWS_STORAGE_BUCKET_NAME or 'nasat-media'

        # Build URL that goes through the Ingress /media path
        full_url = f"{base_url}/media/{bucket}/{avatar_path}"

        print(f"[DEBUG] Constructed full URL: {full_url}")
        return full_url
