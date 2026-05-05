from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    is_verified = models.BooleanField(default=False)
    title = models.CharField(max_length=150, blank=True)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        return self.username

class SocialLink(models.Model):
    PLATFORM_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('telegram', 'Telegram'),
        ('X', 'X (formerly Twitter)'),
        ('instagram', 'Instagram'),
        ('linkedin', 'LinkedIn'),
        ('facebook', 'Facebook'),
        ('github', 'GitHub'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='social_links')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    # Changed from URLField to CharField to accept numbers, handles, or URLs
    url = models.CharField(max_length=255) 

    # Removed 'unique_together' to allow multiple links for the same platform

    def __str__(self):
        return f"{self.user.username} - {self.platform}"
