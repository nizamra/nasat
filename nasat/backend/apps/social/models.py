from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Follow(models.Model):
  follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
  following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
  created_at = models.DateTimeField(auto_now_add=True)

  class Meta:
      unique_together = ("follower", "following")


class Post(models.Model):
  created_at = models.DateTimeField(auto_now_add=True, db_index=True)
class Follow(models.Model):
  follower = models.ForeignKey(..., db_index=True)
  following = models.ForeignKey(..., db_index=True)
