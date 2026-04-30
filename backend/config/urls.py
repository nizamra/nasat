from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.users.views import RegisterView
from apps.social.views import FollowToggleView
from apps.posts.views import CreatePostView, FeedView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth
    path('api/auth/register/', RegisterView.as_view()),
    path('api/auth/login/', TokenObtainPairView.as_view()),
    path('api/auth/refresh/', TokenRefreshView.as_view()),

    # Social & Posts
    path('api/follow/<int:user_id>/', FollowToggleView.as_view()),
    path('api/posts/', CreatePostView.as_view()),
    path('api/feed/', FeedView.as_view()),
]