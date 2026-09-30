# Baseline migration for the social app.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='FamilyRelation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('relation_type', models.CharField(choices=[('mother', 'Mother'), ('son', 'Son'), ('fiancee', 'Fiancée'), ('brother', 'Brother'), ('father', 'Father'), ('daughter', 'Daughter'), ('sister', 'Sister')], max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('related_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='family_of', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='family_defined', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'related_user')},
            },
        ),
    ]
