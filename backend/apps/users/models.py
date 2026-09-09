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


class Relation(models.Model):
    RELATION_TYPES = [
        ('mother', 'Mother'),
        ('father', 'Father'),
        ('sister', 'Sister'),
        ('brother', 'Brother'),
        ('daughter', 'Daughter'),
        ('son', 'Son'),
        ('wife', 'Wife'),
        ('husband', 'Husband'),
        ('fiancee', 'Fiancée'),
        ('fiance', 'Fiancé'),
        ('grandmother', 'Grandmother'),
        ('grandfather', 'Grandfather'),
        ('granddaughter', 'Granddaughter'),
        ('grandson', 'Grandson'),
        ('aunt', 'Aunt'),
        ('uncle', 'Uncle'),
        ('cousin', 'Cousin'),
        ('friend', 'Friend'),
        ('colleague', 'Colleague'),
        ('other', 'Other'),
    ]

    # Reverse relationship mapping
    REVERSE_RELATIONS = {
        'mother': 'son',
        'father': 'daughter',
        'sister': 'brother',
        'brother': 'sister',
        'daughter': 'father',
        'son': 'mother',
        'wife': 'husband',
        'husband': 'wife',
        'fiancee': 'fiance',
        'fiance': 'fiancee',
        'grandmother': 'grandson',
        'grandfather': 'granddaughter',
        'granddaughter': 'grandmother',
        'grandson': 'grandfather',
        'aunt': 'nephew',
        'uncle': 'niece',
        'cousin': 'cousin',
        'friend': 'friend',
        'colleague': 'colleague',
        'other': 'other',
    }

    from_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='relations_from')
    to_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='relations_to')
    relation_type = models.CharField(max_length=20, choices=RELATION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user', 'relation_type')

    def __str__(self):
        return f"{self.from_user.username} is {self.relation_type} of {self.to_user.username}"

    def save(self, *args, **kwargs):
        # Prevent circular relationships
        if self.from_user == self.to_user:
            raise ValueError("Cannot create relationship with oneself")

        super().save(*args, **kwargs)

        # Create reverse relationship if it doesn't exist
        reverse_type = self.REVERSE_RELATIONS.get(self.relation_type)
        if reverse_type:
            reverse_relation, created = Relation.objects.get_or_create(
                from_user=self.to_user,
                to_user=self.from_user,
                relation_type=reverse_type
            )


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

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='social_links')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    # Changed from URLField to CharField to accept numbers, handles, or URLs
    url = models.CharField(max_length=255)

    # Removed 'unique_together' to allow multiple links for the same platform

    def __str__(self):
        return f"{self.user.username} - {self.platform}"
