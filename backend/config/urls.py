from django.contrib import admin
from django.urls import path
from apps.users.views import RelationViewSet, SocialLinkViewSet
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

    path('api/', include(router.urls)),
]
