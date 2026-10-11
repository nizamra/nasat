from django.contrib import admin
from django.urls import path
from apps.users.views import (
    AllergyViewSet, EducationViewSet, EmergencyContactViewSet,
    HealthItemViewSet, LifeEventViewSet, PersonAliasViewSet,
    PersonDeviceViewSet, PersonInterestViewSet, PersonLanguageViewSet,
    PersonNoteViewSet, PetViewSet, RelationViewSet, SocialLinkViewSet,
)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.views import UserViewSet
from apps.posts.views import PostViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'posts', PostViewSet)
router.register(r'relations', RelationViewSet, basename='relation')
router.register(r'social-links', SocialLinkViewSet, basename='social-link')
router.register(r'person-aliases', PersonAliasViewSet, basename='person-alias')
router.register(r'life-events', LifeEventViewSet, basename='life-event')
router.register(r'devices', PersonDeviceViewSet, basename='device')
router.register(r'languages', PersonLanguageViewSet, basename='language')
router.register(r'emergency-contacts', EmergencyContactViewSet, basename='emergency-contact')
router.register(r'allergies', AllergyViewSet, basename='allergy')
router.register(r'health-items', HealthItemViewSet, basename='health-item')
router.register(r'pets', PetViewSet, basename='pet')
router.register(r'education', EducationViewSet, basename='education')
router.register(r'interests', PersonInterestViewSet, basename='interest')
router.register(r'notes', PersonNoteViewSet, basename='note')

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include(router.urls)),
]
