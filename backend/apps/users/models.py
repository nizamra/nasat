from datetime import date

from django.db import models, transaction
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    SEX_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]

    is_verified = models.BooleanField(default=False)
    sex = models.CharField(max_length=10, choices=SEX_CHOICES, blank=True)
    title = models.CharField(max_length=150, blank=True)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    @property
    def age(self):
        """Age in whole years, or None when birth_date is not set."""
        if not self.birth_date:
            return None
        today = timezone.localdate()
        b = self.birth_date
        return today.year - b.year - ((today.month, today.day) < (b.month, b.day))

    @property
    def next_birthday(self):
        """Date of the next birthday (today counts), or None without birth_date.

        A Feb 29 birthday is celebrated on Feb 28 in non-leap years.
        """
        if not self.birth_date:
            return None
        today = timezone.localdate()
        for year in (today.year, today.year + 1):
            try:
                candidate = self.birth_date.replace(year=year)
            except ValueError:
                candidate = date(year, 2, 28)
            if candidate >= today:
                return candidate

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
        ('nephew', 'Nephew'),
        ('niece', 'Niece'),
        ('cousin', 'Cousin'),
        ('friend', 'Friend'),
        ('colleague', 'Colleague'),
        ('other', 'Other'),
    ]

    # Relation types that imply the sex of the person they describe.
    IMPLIED_SEX = {
        'mother': 'female', 'sister': 'female', 'daughter': 'female',
        'wife': 'female', 'fiancee': 'female', 'grandmother': 'female',
        'granddaughter': 'female', 'aunt': 'female', 'niece': 'female',
        'father': 'male', 'brother': 'male', 'son': 'male',
        'husband': 'male', 'fiance': 'male', 'grandfather': 'male',
        'grandson': 'male', 'uncle': 'male', 'nephew': 'male',
    }

    # For each relation type, the reverse type as (if from_user is male,
    # if from_user is female). The reverse describes from_user relative to
    # to_user, so it depends on from_user's sex.
    SEX_AWARE_REVERSE = {
        'mother': ('son', 'daughter'),
        'father': ('son', 'daughter'),
        'son': ('father', 'mother'),
        'daughter': ('father', 'mother'),
        'sister': ('brother', 'sister'),
        'brother': ('brother', 'sister'),
        'grandmother': ('grandson', 'granddaughter'),
        'grandfather': ('grandson', 'granddaughter'),
        'grandson': ('grandfather', 'grandmother'),
        'granddaughter': ('grandfather', 'grandmother'),
        'aunt': ('nephew', 'niece'),
        'uncle': ('nephew', 'niece'),
        'nephew': ('uncle', 'aunt'),
        'niece': ('uncle', 'aunt'),
    }

    # Legacy reverse relationship mapping (used when from_user's sex is unknown)
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
        'nephew': 'uncle',
        'niece': 'aunt',
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

    @classmethod
    def get_reverse_type(cls, relation_type, from_user_sex=''):
        """Reverse type for `relation_type`, using from_user's sex when known."""
        pair = cls.SEX_AWARE_REVERSE.get(relation_type)
        if pair and from_user_sex in ('male', 'female'):
            return pair[0] if from_user_sex == 'male' else pair[1]
        return cls.REVERSE_RELATIONS.get(relation_type)

    def delete_reverse(self):
        """Delete the automatically created reverse row(s) of this relation."""
        pair = self.SEX_AWARE_REVERSE.get(self.relation_type)
        if pair:
            candidates = set(pair)
        else:
            legacy = self.REVERSE_RELATIONS.get(self.relation_type)
            candidates = {legacy} if legacy else set()
        Relation.objects.filter(
            from_user_id=self.to_user_id,
            to_user_id=self.from_user_id,
            relation_type__in=candidates,
        ).delete()

    def delete(self, *args, **kwargs):
        # Save() creates the reverse row, so deleting must remove it too
        with transaction.atomic():
            self.delete_reverse()
            return super().delete(*args, **kwargs)

    def save(self, *args, **kwargs):
        # Prevent circular relationships
        if self.from_user == self.to_user:
            raise ValueError("Cannot create relationship with oneself")

        super().save(*args, **kwargs)

        # Create reverse relationship if it doesn't exist
        reverse_type = self.get_reverse_type(
            self.relation_type, self.from_user.sex)
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
