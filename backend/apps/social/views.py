from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Follow
from django.contrib.auth import get_user_model

User = get_user_model()

class FollowToggleView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, request, user_id):
    target = User.objects.get(id=user_id)
    obj, created = Follow.objects.get_or_create(
      follower=request.user,
      following=target
    )

    if not created:
      obj.delete()
      return Response({"status": "unfollowed"})

    return Response({"status": "followed"})
