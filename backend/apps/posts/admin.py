from django.contrib import admin
from django.utils.html import format_html
from .models import Post

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'content_snippet', 'has_image', 'created_at')
    list_filter = ('created_at', 'user')
    search_fields = ('content', 'user__username')
    raw_id_fields = ('user',)
    readonly_fields = ('image_preview',)

    # Custom column to show if an image exists
    def has_image(self, obj):
        return bool(obj.image)
    has_image.boolean = True # Shows a nice checkbox icon

    # Custom column to show a short version of the text
    def content_snippet(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content

    # Shows a small thumbnail in the "Edit" page
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 200px;"/>', obj.image.url)
        return "No image uploaded"