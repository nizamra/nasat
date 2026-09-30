from django.contrib import admin
from .models import FamilyRelation

@admin.register(FamilyRelation)
class FamilyRelationAdmin(admin.ModelAdmin):
    list_display = ('user', 'relation_type', 'related_user', 'created_at')
    list_filter = ('relation_type', 'created_at')
    raw_id_fields = ('user', 'related_user')
    search_fields = ('user__username', 'related_user__username')