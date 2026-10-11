from datetime import date
from decimal import Decimal

from django.db import models, transaction
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.utils import timezone


class User(AbstractUser):
    class Meta:
        verbose_name = 'person'
        verbose_name_plural = 'people'

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
    death_date = models.DateField(null=True, blank=True)
    DATE_PRECISION_CHOICES = [
        ('exact', 'Exact'), ('day_approximate', 'Approximate day'),
        ('month', 'Month only'), ('year', 'Year only'),
    ]
    birth_date_precision = models.CharField(
        max_length=20, choices=DATE_PRECISION_CHOICES, default='exact', blank=True)
    death_date_precision = models.CharField(
        max_length=20, choices=DATE_PRECISION_CHOICES, default='exact', blank=True)
    place_of_birth = models.CharField(max_length=200, blank=True)
    current_city = models.CharField(max_length=200, blank=True)
    height_cm = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1)])
    weight_kg = models.DecimalField(
        max_digits=5, decimal_places=1, null=True, blank=True,
        validators=[MinValueValidator(Decimal("0.1"))])
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    @property
    def age(self):
        """Age in whole years at death, or today for a living person."""
        if not self.birth_date:
            return None
        today = self.death_date or timezone.localdate()
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
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    date_precision = models.CharField(
        max_length=20, choices=User.DATE_PRECISION_CHOICES,
        default='exact', blank=True)
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
                relation_type=reverse_type,
                defaults={
                    'start_date': self.start_date,
                    'end_date': self.end_date,
                    'date_precision': self.date_precision,
                },
            )
            if not created:
                Relation.objects.filter(pk=reverse_relation.pk).update(
                    start_date=self.start_date,
                    end_date=self.end_date,
                    date_precision=self.date_precision,
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


class PersonAlias(models.Model):
    ALIAS_TYPES = [
        ('former_name', 'Former name'), ('alias', 'Alias'),
        ('preferred_name', 'Preferred name'),
    ]
    person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='aliases')
    name = models.CharField(max_length=200)
    alias_type = models.CharField(max_length=20, choices=ALIAS_TYPES, default='alias')
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.name


class LifeEvent(models.Model):
    person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='life_events')
    title = models.CharField(max_length=150)
    event_date = models.DateField(null=True, blank=True)
    date_precision = models.CharField(
        max_length=20, choices=User.DATE_PRECISION_CHOICES, default='exact', blank=True)
    place = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    source_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['event_date', 'id']

    def __str__(self):
        return self.title


class PersonDevice(models.Model):
    DEVICE_TYPES = [
        ('mobile', 'Mobile phone'), ('tablet', 'Tablet'), ('laptop', 'Laptop'),
        ('desktop', 'Desktop PC'), ('other', 'Other'),
    ]
    person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES)
    manufacturer = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=150, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.get_device_type_display()} {self.model}".strip()


class PersonLanguage(models.Model):
    PROFICIENCY_CHOICES = [
        ('native', 'Native'), ('fluent', 'Fluent'), ('learning', 'Learning'),
    ]
    person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='languages')
    language = models.CharField(max_length=100)
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES)
    notes = models.CharField(max_length=250, blank=True)

    def __str__(self):
        return f"{self.language} ({self.proficiency})"


class EmergencyContact(models.Model):
    person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emergency_contacts')
    name = models.CharField(max_length=200)
    relationship = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    language = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.name


class Allergy(models.Model):
    CATEGORIES = [('food', 'Food'), ('drug', 'Drug'), ('environmental', 'Environmental')]
    SEVERITIES = [('mild', 'Mild'), ('moderate', 'Moderate'), ('severe', 'Severe'), ('unknown', 'Unknown')]
    person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='allergies')
    category = models.CharField(max_length=20, choices=CATEGORIES)
    allergen = models.CharField(max_length=150)
    severity = models.CharField(max_length=20, choices=SEVERITIES, default='unknown')
    reaction = models.TextField(blank=True)
    treatment = models.TextField(blank=True)

    def __str__(self):
        return self.allergen


class HealthItem(models.Model):
    CATEGORIES = [
        ('medication', 'Medication'), ('chronic_condition', 'Chronic condition'),
        ('mental_health_support', 'Mental health support need'),
    ]
    person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='health_items')
    category = models.CharField(max_length=30, choices=CATEGORIES)
    name = models.CharField(max_length=200)
    details = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Pet(models.Model):
    person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pets')
    name = models.CharField(max_length=100)
    species = models.CharField(max_length=100, blank=True)
    breed = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Education(models.Model):
    STUDY_LEVELS = [
        ('school', 'School'), ('undergraduate', 'Undergraduate'),
        ('graduate', 'Graduate'), ('doctoral', 'Doctoral'), ('other', 'Other'),
    ]
    person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='education')
    university = models.CharField(max_length=200)
    program = models.CharField(max_length=200, blank=True)
    study_level = models.CharField(max_length=20, choices=STUDY_LEVELS, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.university


class PersonInterest(models.Model):
    CATEGORIES = [
        ('hobby', 'Hobby'), ('sport', 'Sport'), ('music', 'Music'),
        ('book', 'Book'), ('movie', 'Movie'), ('bucket_list', 'Dream or aspiration'),
        ('favorite_food', 'Favorite food'), ('technical_skill', 'Technical skill'),
        ('media_preference', 'Media preference'),
    ]
    person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interests')
    category = models.CharField(max_length=30, choices=CATEGORIES)
    name = models.CharField(max_length=200)
    details = models.TextField(blank=True)

    def __str__(self):
        return self.name


class PersonNote(models.Model):
    person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return self.title or f"Note for {self.person.username}"
