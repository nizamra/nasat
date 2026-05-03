from rest_framework import generics # Added this import
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import PostSerializer
from .services.feed import get_user_feed
from .models import Post
from rest_framework import viewsets

class FeedView(APIView):
  def get(self, request):
    posts = get_user_feed(request.user)
    return Response(PostSerializer(posts, many=True).data)

class CreatePostView(generics.CreateAPIView):
  queryset = Post.objects.all()
  serializer_class = PostSerializer
  
  def perform_create(self, serializer):
    serializer.save(user=self.request.user)

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
