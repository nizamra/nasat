from rest_framework import generics
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer
from .models import User
from .serializers import UserSerializer
from rest_framework import viewsets, permissions

User = get_user_model()

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'username'
    # This makes the profile public
    permission_classes = [permissions.AllowAny]

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = []
