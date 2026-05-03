from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Follow(models.Model):
  follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
  following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
  created_at = models.DateTimeField(auto_now_add=True, db_index=True)

  class Meta:
    unique_together = ("follower", "following")

  def __str__(self):
    return f"{self.follower} follows {self.following}"

class FamilyRelation(models.Model):
    RELATION_CHOICES = [
        ('mother', 'Mother'),
        ('son', 'Son'),
        ('fiancee', 'Fiancée'),
        ('brother', 'Brother'),
        ('father', 'Father'),
        ('daughter', 'Daughter'),
        ('sister', 'Sister'),
    ]
    
    # The user who is defining the relationship
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='family_defined')
    # The user who is the family member
    related_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='family_of')
    
    relation_type = models.CharField(max_length=20, choices=RELATION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "related_user")

    def __str__(self):
        return f"{self.user} -> {self.relation_type} -> {self.related_user}"
