from django.contrib import admin
from .models import FamilyRelation, Follow

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('id', 'follower', 'following', 'created_at')
    list_filter = ('created_at',)
    # This is a DevOps life-saver: instead of a slow dropdown of 10,000 users, 
    # it gives you a search popup.
    raw_id_fields = ('follower', 'following')

@admin.register(FamilyRelation)
class FamilyRelationAdmin(admin.ModelAdmin):
    list_display = ('user', 'relation_type', 'related_user', 'created_at')
    list_filter = ('relation_type', 'created_at')
    raw_id_fields = ('user', 'related_user')
    search_fields = ('user__username', 'related_user__username')