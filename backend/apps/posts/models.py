from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField(blank=True)
    # Changed from CharField to ImageField
    image = models.ImageField(upload_to='posts/', null=True, blank=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.id}"
