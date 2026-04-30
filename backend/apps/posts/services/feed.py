from django.utils import timezone
from datetime import timedelta
from django.db.models import F, ExpressionWrapper, FloatField
from .models import Post
from apps.social.models import Follow


def get_user_feed(user):
  following_ids = Follow.objects.filter(
    follower=user
  ).values_list("following_id", flat=True)

  now = timezone.now()

  qs = Post.objects.filter(user_id__in=following_ids)

  # Recency score (newer = higher)
  qs = qs.annotate(
    age_hours=ExpressionWrapper(
      (now - F("created_at")),
      output_field=FloatField()
    )
  )

  # Simplified ranking: order by created_at desc
  # Extend later with engagement signals
  return qs.order_by("-created_at")[:50]

score = (
  w1 * recency_decay +
  w2 * engagement_score +
  w3 * relationship_strength
)
