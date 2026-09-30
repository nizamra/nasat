from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.users.views import RegisterView, RelationViewSet, SocialLinkViewSet
from apps.posts.views import CreatePostView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.views import UserViewSet
from apps.posts.views import PostViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'posts', PostViewSet)
router.register(r'relations', RelationViewSet, basename='relation')
router.register(r'social-links', SocialLinkViewSet, basename='social-link')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/', include(router.urls)),
    path('api/auth/register/', RegisterView.as_view()),
    path('api/auth/login/', TokenObtainPairView.as_view()),
    path('api/auth/refresh/', TokenRefreshView.as_view()),

    # Posts
    path('api/posts/', CreatePostView.as_view()),
]
