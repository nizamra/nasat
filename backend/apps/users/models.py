from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # AbstractUser already provides: username, first_name, last_name, email, password, date_joined
    
    is_verified = models.BooleanField(default=False)
    title = models.CharField(max_length=150, blank=True) # e.g., "Entrepreneur • Investor"
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    
    # Because you configured S3/MinIO in settings, ImageField automatically uploads there
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
    url = models.URLField()

    class Meta:
        unique_together = ("user", "platform") # Prevents duplicate platforms per user

    def __str__(self):
        return f"{self.user.username} - {self.platform}"
