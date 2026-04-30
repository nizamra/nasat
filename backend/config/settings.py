from datetime import timedelta

INSTALLED_APPS += ["storages"]

AWS_ACCESS_KEY_ID = "minioadmin"
AWS_SECRET_ACCESS_KEY = "minioadmin"
AWS_STORAGE_BUCKET_NAME = "nasat-media"
AWS_S3_ENDPOINT_URL = "http://minio:9000"

AWS_S3_USE_SSL = False
AWS_QUERYSTRING_AUTH = False

DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"


REST_FRAMEWORK = {
  "DEFAULT_AUTHENTICATION_CLASSES": (
    "rest_framework_simplejwt.authentication.JWTAuthentication",
  ),
  "DEFAULT_PERMISSION_CLASSES": (
    "rest_framework.permissions.IsAuthenticated",
  ),
}

SIMPLE_JWT = {
  "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
  "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
  "AUTH_HEADER_TYPES": ("Bearer",),
}
