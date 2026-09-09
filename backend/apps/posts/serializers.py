from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'user', 'user_username', 'content', 'image', 'created_at']
