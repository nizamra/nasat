from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SocialLink

# This allows you to add/edit Social Links directly on the User page!
class SocialLinkInline(admin.StackedInline):
    model = SocialLink
    extra = 1 # Show one empty slot by default

class CustomUserAdmin(UserAdmin):
    # Add Social Links to the bottom of the User page
    inlines = [SocialLinkInline]
    
    # 1. This controls the list view (the table of users)
    list_display = ('username', 'email', 'title', 'is_verified', 'is_staff')
    
    # 2. This adds your custom fields to the "Edit" page
    # We append a new section called 'Profile Info'
    fieldsets = UserAdmin.fieldsets + (
        ('Profile Info', {'fields': ('is_verified', 'title', 'bio', 'location', 'birth_date', 'avatar')}),
    )

    # 3. This adds your custom fields to the "Add User" page (if you want them there)
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Profile Info', {'fields': ('title', 'location', 'avatar')}),
    )

# Register the new class
admin.site.register(User, CustomUserAdmin)