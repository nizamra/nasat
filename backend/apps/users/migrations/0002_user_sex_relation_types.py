from django.db import migrations, models


class Migration(migrations.Migration):
    """Adds User.sex and the nephew/niece relation types.

    NOTE: the repo has no migrations for the User / SocialLink models, so this
    only contains the new changes. See the hand-off notes before applying it to
    a database whose users_user table was created some other way.
    """

    dependencies = [
        ('users', '0001_create_relation'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='sex',
            field=models.CharField(
                blank=True,
                choices=[('male', 'Male'), ('female', 'Female')],
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name='relation',
            name='relation_type',
            field=models.CharField(max_length=20, choices=[
                ('mother', 'Mother'), ('father', 'Father'),
                ('sister', 'Sister'), ('brother', 'Brother'),
                ('daughter', 'Daughter'), ('son', 'Son'),
                ('wife', 'Wife'), ('husband', 'Husband'),
                ('fiancee', 'Fiancée'), ('fiance', 'Fiancé'),
                ('grandmother', 'Grandmother'), ('grandfather', 'Grandfather'),
                ('granddaughter', 'Granddaughter'), ('grandson', 'Grandson'),
                ('aunt', 'Aunt'), ('uncle', 'Uncle'),
                ('nephew', 'Nephew'), ('niece', 'Niece'),
                ('cousin', 'Cousin'), ('friend', 'Friend'),
                ('colleague', 'Colleague'), ('other', 'Other'),
            ]),
        ),
    ]
