from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import (
    AllergySerializer, EducationSerializer, EmergencyContactSerializer,
    HealthItemSerializer, LifeEventSerializer, PersonAliasSerializer,
    PersonDeviceSerializer, PersonInterestSerializer, PersonLanguageSerializer,
    PersonNoteSerializer, PetSerializer, RegisterSerializer, UserSerializer,
    RelationSerializer, SocialLinkSerializer, BirthdaySerializer,
)
from .models import (
    Allergy, Education, EmergencyContact, HealthItem, LifeEvent, PersonAlias,
    PersonDevice, PersonInterest, PersonLanguage, PersonNote, Pet,
    User, Relation, SocialLink,
)
from django.db.models import Q

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'username'
    # This makes the profile public for viewing
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action == 'create':
            return RegisterSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = User.objects.all()

        # Filter by verified status if specified
        verified = self.request.query_params.get('verified', None)
        if verified is not None:
            verified_bool = verified.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_verified=verified_bool)

        # Order by verified first, then by date_joined
        queryset = queryset.order_by('-is_verified', '-date_joined')

        return queryset

    @action(detail=False, methods=['get'])
    def by_verified(self, request):
        """Get users ordered by verified status"""
        verified_users = User.objects.filter(
            is_verified=True).order_by('-date_joined')
        serializer = self.get_serializer(verified_users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def birthdays(self, request):
        """All profiles with a birth date, soonest upcoming birthday first.

        Not paginated, so the Events schedule always sees every profile.
        """
        users = sorted(
            User.objects.filter(
                death_date__isnull=True,
                birth_date_precision__in=('exact', 'day_approximate'),
            ).exclude(birth_date__isnull=True),
            key=lambda u: (u.next_birthday, u.username))
        return Response(BirthdaySerializer(users, many=True).data)

    @action(detail=True, methods=['get'])
    def details(self, request, username=None):
        """Return extended profile records only when explicitly requested."""
        person = self.get_object()
        record_sets = {
            'aliases': (person.aliases.all(), PersonAliasSerializer),
            'life_events': (person.life_events.all(), LifeEventSerializer),
            'devices': (person.devices.all(), PersonDeviceSerializer),
            'languages': (person.languages.all(), PersonLanguageSerializer),
            'emergency_contacts': (person.emergency_contacts.all(), EmergencyContactSerializer),
            'allergies': (person.allergies.all(), AllergySerializer),
            'health_items': (person.health_items.all(), HealthItemSerializer),
            'pets': (person.pets.all(), PetSerializer),
            'education': (person.education.all(), EducationSerializer),
            'interests': (person.interests.all(), PersonInterestSerializer),
            'notes': (person.notes.all(), PersonNoteSerializer),
        }
        context = self.get_serializer_context()
        return Response({
            name: serializer(records, many=True, context=context).data
            for name, (records, serializer) in record_sets.items()
        })


class RelationViewSet(viewsets.ModelViewSet):
    queryset = Relation.objects.all()
    serializer_class = RelationSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Relation.objects.filter(from_user_id=user_id)
        return Relation.objects.all()

    def create(self, request, *args, **kwargs):
        """Create a relation between two users"""
        from_user_id = request.data.get('from_user_id')
        to_user_username = request.data.get('to_user_username')
        relation_type = request.data.get('relation_type')
        start_date = request.data.get('start_date') or None
        end_date = request.data.get('end_date') or None
        date_precision = request.data.get('date_precision') or 'exact'

        # Validate inputs
        if not all([from_user_id, to_user_username, relation_type]):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from_user = User.objects.get(id=from_user_id)
            to_user = User.objects.get(username=to_user_username)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if from_user == to_user:
            return Response(
                {'error': 'Cannot create relation with oneself'},
                status=status.HTTP_400_BAD_REQUEST
            )

        relation_input = self.get_serializer(data={
            'relation_type': relation_type,
            'start_date': start_date,
            'end_date': end_date,
            'date_precision': date_precision,
        })
        if not relation_input.is_valid():
            return Response(relation_input.errors, status=status.HTTP_400_BAD_REQUEST)
        relation_values = relation_input.validated_data

        try:
            relation, created = Relation.objects.get_or_create(
                from_user=from_user,
                to_user=to_user,
                relation_type=relation_values['relation_type'],
                defaults={
                    'start_date': relation_values.get('start_date'),
                    'end_date': relation_values.get('end_date'),
                    'date_precision': relation_values.get('date_precision', 'exact'),
                },
            )

            if not created:
                return Response(
                    {'message': 'Relation already exists'},
                    status=status.HTTP_200_OK
                )

            serializer = self.get_serializer(relation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class SocialLinkViewSet(viewsets.ModelViewSet):
    queryset = SocialLink.objects.all()
    serializer_class = SocialLinkSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return SocialLink.objects.filter(user_id=user_id)
        return SocialLink.objects.all()

    def create(self, request, *args, **kwargs):
        """Create a social link for a user"""
        user_id = request.data.get('user')
        platform = request.data.get('platform')
        url = request.data.get('url')

        # Validate inputs
        if not all([user_id, platform, url]):
            return Response(
                {'error': 'Missing required fields: user, platform, url'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            social_link = SocialLink.objects.create(
                user=user,
                platform=platform,
                url=url
            )
            serializer = self.get_serializer(social_link)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class PersonRecordViewSet(viewsets.ModelViewSet):
    """CRUD endpoint base for records attached to an existing person."""
    permission_classes = [permissions.AllowAny]
    queryset = None
    serializer_class = None

    def get_queryset(self):
        queryset = self.queryset.select_related('person')
        person_id = self.request.query_params.get('person_id')
        return queryset.filter(person_id=person_id) if person_id else queryset


class PersonAliasViewSet(PersonRecordViewSet):
    queryset = PersonAlias.objects.all()
    serializer_class = PersonAliasSerializer


class LifeEventViewSet(PersonRecordViewSet):
    queryset = LifeEvent.objects.all()
    serializer_class = LifeEventSerializer


class PersonDeviceViewSet(PersonRecordViewSet):
    queryset = PersonDevice.objects.all()
    serializer_class = PersonDeviceSerializer


class PersonLanguageViewSet(PersonRecordViewSet):
    queryset = PersonLanguage.objects.all()
    serializer_class = PersonLanguageSerializer


class EmergencyContactViewSet(PersonRecordViewSet):
    queryset = EmergencyContact.objects.all()
    serializer_class = EmergencyContactSerializer


class AllergyViewSet(PersonRecordViewSet):
    queryset = Allergy.objects.all()
    serializer_class = AllergySerializer


class HealthItemViewSet(PersonRecordViewSet):
    queryset = HealthItem.objects.all()
    serializer_class = HealthItemSerializer


class PetViewSet(PersonRecordViewSet):
    queryset = Pet.objects.all()
    serializer_class = PetSerializer


class EducationViewSet(PersonRecordViewSet):
    queryset = Education.objects.all()
    serializer_class = EducationSerializer


class PersonInterestViewSet(PersonRecordViewSet):
    queryset = PersonInterest.objects.all()
    serializer_class = PersonInterestSerializer


class PersonNoteViewSet(PersonRecordViewSet):
    queryset = PersonNote.objects.all()
    serializer_class = PersonNoteSerializer
