from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Post(models.Model):
  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
  content = models.TextField(blank=True)
  image = models.CharField(max_length=512, null=True, blank=True)  # MinIO object path
  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return f"{self.user} - {self.id}"
