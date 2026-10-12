# Initial schema for people, relationships, and profile records.

import django.contrib.auth.models
import django.contrib.auth.validators
import django.db.models.deletion
import django.utils.timezone
import django.core.validators
import decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='email address')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('is_verified', models.BooleanField(default=False)),
                ('sex', models.CharField(blank=True, choices=[('male', 'Male'), ('female', 'Female')], max_length=10)),
                ('title', models.CharField(blank=True, max_length=150)),
                ('bio', models.TextField(blank=True)),
                ('location', models.CharField(blank=True, max_length=100)),
                ('birth_date', models.DateField(blank=True, null=True)),
                ('death_date', models.DateField(blank=True, null=True)),
                ('birth_date_precision', models.CharField(blank=True, choices=[('exact', 'Exact'), ('day_approximate', 'Approximate day'), ('month', 'Month only'), ('year', 'Year only')], default='exact', max_length=20)),
                ('death_date_precision', models.CharField(blank=True, choices=[('exact', 'Exact'), ('day_approximate', 'Approximate day'), ('month', 'Month only'), ('year', 'Year only')], default='exact', max_length=20)),
                ('place_of_birth', models.CharField(blank=True, max_length=200)),
                ('current_city', models.CharField(blank=True, max_length=200)),
                ('height_cm', models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1)])),
                ('weight_kg', models.DecimalField(blank=True, decimal_places=1, max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(decimal.Decimal('0.1'))])),
                ('avatar', models.ImageField(blank=True, null=True, upload_to='avatars/')),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'person',
                'verbose_name_plural': 'people',
                'abstract': False,
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='SocialLink',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('platform', models.CharField(choices=[('whatsapp', 'WhatsApp'), ('telegram', 'Telegram'), ('X', 'X (formerly Twitter)'), ('instagram', 'Instagram'), ('linkedin', 'LinkedIn'), ('facebook', 'Facebook'), ('github', 'GitHub'), ('other', 'Other')], max_length=20)),
                ('url', models.CharField(max_length=255)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='social_links', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Relation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('relation_type', models.CharField(choices=[('mother', 'Mother'), ('father', 'Father'), ('sister', 'Sister'), ('brother', 'Brother'), ('daughter', 'Daughter'), ('son', 'Son'), ('wife', 'Wife'), ('husband', 'Husband'), ('fiancee', 'Fiancée'), ('fiance', 'Fiancé'), ('grandmother', 'Grandmother'), ('grandfather', 'Grandfather'), ('granddaughter', 'Granddaughter'), ('grandson', 'Grandson'), ('aunt', 'Aunt'), ('uncle', 'Uncle'), ('cousin', 'Cousin'), ('friend', 'Friend'), ('colleague', 'Colleague'), ('other', 'Other')], max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('from_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='relations_from', to=settings.AUTH_USER_MODEL)),
                ('to_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='relations_to', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('from_user', 'to_user', 'relation_type')},
            },
        ),
        migrations.AddField(
            model_name='relation', name='start_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='relation', name='end_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='relation', name='date_precision',
            field=models.CharField(blank=True, choices=[('exact', 'Exact'), ('day_approximate', 'Approximate day'), ('month', 'Month only'), ('year', 'Year only')], default='exact', max_length=20),
        ),
        migrations.AlterField(
            model_name='relation', name='relation_type',
            field=models.CharField(choices=[
                ('mother', 'Mother'), ('father', 'Father'), ('sister', 'Sister'),
                ('brother', 'Brother'), ('daughter', 'Daughter'), ('son', 'Son'),
                ('wife', 'Wife'), ('husband', 'Husband'), ('fiancee', 'Fiancée'),
                ('fiance', 'Fiancé'), ('grandmother', 'Grandmother'),
                ('grandfather', 'Grandfather'), ('granddaughter', 'Granddaughter'),
                ('grandson', 'Grandson'), ('aunt', 'Aunt'), ('uncle', 'Uncle'),
                ('nephew', 'Nephew'), ('niece', 'Niece'), ('cousin', 'Cousin'),
                ('friend', 'Friend'), ('colleague', 'Colleague'), ('other', 'Other'),
            ], max_length=20),
        ),
        migrations.CreateModel(
            name='PersonAlias',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('alias_type', models.CharField(choices=[('former_name', 'Former name'), ('alias', 'Alias'), ('preferred_name', 'Preferred name')], default='alias', max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('person', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='aliases', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='LifeEvent',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=150)),
                ('event_date', models.DateField(blank=True, null=True)),
                ('date_precision', models.CharField(blank=True, choices=[('exact', 'Exact'), ('day_approximate', 'Approximate day'), ('month', 'Month only'), ('year', 'Year only')], default='exact', max_length=20)),
                ('place', models.CharField(blank=True, max_length=200)),
                ('description', models.TextField(blank=True)),
                ('source_notes', models.TextField(blank=True)),
                ('person', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='life_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['event_date', 'id']},
        ),
        migrations.CreateModel(
            name='PersonDevice',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('device_type', models.CharField(choices=[('mobile', 'Mobile phone'), ('tablet', 'Tablet'), ('laptop', 'Laptop'), ('desktop', 'Desktop PC'), ('other', 'Other')], max_length=20)),
                ('manufacturer', models.CharField(blank=True, max_length=100)),
                ('model', models.CharField(blank=True, max_length=150)),
                ('notes', models.TextField(blank=True)),
                ('person', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='devices', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='PersonLanguage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(max_length=100)),
                ('proficiency', models.CharField(choices=[('native', 'Native'), ('fluent', 'Fluent'), ('learning', 'Learning')], max_length=20)),
                ('notes', models.CharField(blank=True, max_length=250)),
                ('person', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='languages', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='EmergencyContact',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('relationship', models.CharField(blank=True, max_length=100)),
                ('phone', models.CharField(blank=True, max_length=50)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('language', models.CharField(blank=True, max_length=100)),
                ('person', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='emergency_contacts', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Allergy',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(choices=[('food', 'Food'), ('drug', 'Drug'), ('environmental', 'Environmental')], max_length=20)),
                ('allergen', models.CharField(max_length=150)),
                ('severity', models.CharField(choices=[('mild', 'Mild'), ('moderate', 'Moderate'), ('severe', 'Severe'), ('unknown', 'Unknown')], default='unknown', max_length=20)),
                ('reaction', models.TextField(blank=True)),
                ('treatment', models.TextField(blank=True)),
                ('person', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='allergies', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='HealthItem',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(choices=[('medication', 'Medication'), ('chronic_condition', 'Chronic condition'), ('mental_health_support', 'Mental health support need')], max_length=30)),
                ('name', models.CharField(max_length=200)),
                ('details', models.TextField(blank=True)),
                ('person', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='health_items', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Pet',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('species', models.CharField(blank=True, max_length=100)),
                ('breed', models.CharField(blank=True, max_length=100)),
                ('notes', models.TextField(blank=True)),
                ('person', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pets', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Education',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('university', models.CharField(max_length=200)),
                ('program', models.CharField(blank=True, max_length=200)),
                ('study_level', models.CharField(blank=True, choices=[('school', 'School'), ('undergraduate', 'Undergraduate'), ('graduate', 'Graduate'), ('doctoral', 'Doctoral'), ('other', 'Other')], max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('person', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='education', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='PersonInterest',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(choices=[('hobby', 'Hobby'), ('sport', 'Sport'), ('music', 'Music'), ('book', 'Book'), ('movie', 'Movie'), ('bucket_list', 'Dream or aspiration'), ('favorite_food', 'Favorite food'), ('technical_skill', 'Technical skill'), ('media_preference', 'Media preference')], max_length=30)),
                ('name', models.CharField(max_length=200)),
                ('details', models.TextField(blank=True)),
                ('person', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='interests', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='PersonNote',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(blank=True, max_length=200)),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('person', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at', '-id']},
        ),
    ]
