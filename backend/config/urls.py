from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.users.views import RegisterView
from apps.social.views import FollowToggleView
from apps.posts.views import CreatePostView, FeedView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.views import UserViewSet
from apps.posts.views import PostViewSet
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'posts', PostViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth
    path('api/', include(router.urls)),
    path('api/auth/register/', RegisterView.as_view()),
    path('api/auth/login/', TokenObtainPairView.as_view()),
    path('api/auth/refresh/', TokenRefreshView.as_view()),

    # Social & Posts
    path('api/follow/<int:user_id>/', FollowToggleView.as_view()),
    path('api/posts/', CreatePostView.as_view()),
    path('api/feed/', FeedView.as_view()),
]
