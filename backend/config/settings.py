import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# TODO: change into SECRET_KEY = os.environ.get('SECRET_KEY') and set env var in K3s deployment
# python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())' to generate a new one for production
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-nasat-poc-key')

DEBUG = True # Set to False in production

# TODO: Change this in production to your actual domain or IP
# Or ['staging.nasat.local', 'backend', 'localhost', '127.0.0.1']
ALLOWED_HOSTS = ['*'] # For K3S access

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # 3rd Party
    'rest_framework',
    'rest_framework_simplejwt',
    'storages',
    'django_filters',
    # Apps
    'apps.users',
    'apps.posts',
    'apps.social',
    # CORS
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    "http://staging.nasat.local",
    "http://localhost:3000",
]

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi:application'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- Your Custom Configs ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# MinIO/S3 Storage
AWS_ACCESS_KEY_ID = os.environ.get('MINIO_ACCESS_KEY', 'minioadmin')
AWS_SECRET_ACCESS_KEY = os.environ.get('MINIO_SECRET_KEY', 'minioadmin')
AWS_STORAGE_BUCKET_NAME = os.environ.get('MINIO_BUCKET_NAME', 'nasat-media')
AWS_S3_ENDPOINT_URL = os.environ.get('MINIO_ENDPOINT', 'http://minio:9000')
AWS_S3_URL_PROTOCOL = 'http'
AWS_S3_REGION_NAME = 'us-east-1'
AWS_S3_USE_SSL = False
AWS_QUERYSTRING_AUTH = False

# This ensures Django uses MinIO for media files
# Tells WhiteNoise to compress and cache the files for better performance
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Ensure media URLs point to MinIO
MEDIA_URL = f'{AWS_S3_ENDPOINT_URL}/{AWS_STORAGE_BUCKET_NAME}/'

# Tell Django to use your custom user model instead of the default one
AUTH_USER_MODEL = 'users.User'

# Update DATABASES to point to your K3s Postgres StatefulSet
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'nasat'),
        'USER': os.environ.get('POSTGRES_USER', 'nasat'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'nasat'),
        # The HOST must match the 'serviceName' defined in your StatefulSet
        'HOST': os.environ.get('POSTGRES_HOST', 'postgres'), 
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
    }
}

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
