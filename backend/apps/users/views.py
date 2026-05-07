from rest_framework import generics, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer, RelationSerializer, SocialLinkSerializer
from .models import User, Relation, SocialLink
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

        try:
            relation, created = Relation.objects.get_or_create(
                from_user=from_user,
                to_user=to_user,
                relation_type=relation_type
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


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = []
