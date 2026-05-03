from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

# This tells Django to use the standard User interface for your custom model
admin.site.register(User, UserAdmin)
