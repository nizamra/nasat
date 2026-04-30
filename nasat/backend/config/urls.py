urlpatterns = [
  path("auth/register/", RegisterView.as_view()),
  path("auth/login/", TokenObtainPairView.as_view()),

  path("follow/<int:user_id>/", FollowToggleView.as_view()),

  path("posts/", CreatePostView.as_view()),
  path("feed/", FeedView.as_view()),
]
