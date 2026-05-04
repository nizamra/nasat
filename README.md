# NASAT - Social Media Platform

![License](https://img.shields.io/badge/license-MIT-green)
![CI](https://github.com/nizamra/nasat/actions/workflows/build-docker-push-all.yaml/badge.svg)
![FR](https://github.com/nizamra/nasat/actions/workflows/build-docker-push-fr.yaml/badge.svg)
![BK](https://github.com/nizamra/nasat/actions/workflows/build-docker-push-bk.yaml/badge.svg)
![Backend](https://img.shields.io/badge/backend-Django-darkgreen)
![Frontend](https://img.shields.io/badge/frontend-React-blue)
![K8s](https://img.shields.io/badge/deployment-Kubernetes-blue)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![ArgoCD](https://img.shields.io/badge/gitops-argocd-orange)

A full-stack social media application built with Django, React, and Kubernetes. NASAT is a proof-of-concept platform that enables users to create posts, upload images, follow other users, and build a social network.

## Features

- **User Management**: Authentication using JWT tokens with secure login/refresh endpoints
- **Posts**: Create and share text posts with optional image attachments
- **Social Connections**: Follow/unfollow other users to build your social network
- **Image Storage**: Images stored in MinIO object storage for scalable media management
- **REST API**: Full RESTful API with Django REST Framework
- **Responsive UI**: Modern React frontend with TypeScript and Vite

## Project Structure

```
nasat/
├── backend/              # Django REST API
│   ├── apps/
│   │   ├── posts/       # Post creation and feed management
│   │   ├── social/      # Follow relationships
│   │   └── users/       # User authentication and profile
│   ├── config/          # Django settings and routing
│   ├── Dockerfile       # Backend containerization
│   ├── manage.py        # Django management
│   └── requirements.txt  # Python dependencies
├── frontend/            # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page-level components
│   │   └── styles/      # CSS styling
│   ├── Dockerfile       # Frontend containerization
│   ├── vite.config.ts   # Vite build configuration
│   ├── tsconfig.json    # TypeScript configuration
│   └── package.json     # Node dependencies
├── k8s/                 # Kubernetes manifests
│   ├── argocd/         # ArgoCD deployment configuration
│   ├── backend/        # Backend deployment manifests
│   ├── frontend/       # Frontend deployment manifests
│   ├── ingress/        # Ingress configuration
│   ├── minio/          # MinIO object storage setup
│   └── postgres/       # PostgreSQL database setup
└── README.md           # This file
```

## Technology Stack

### Backend
- **Framework**: Django with Django REST Framework
- **Authentication**: JWT (JSON Web Tokens) with simplejwt
- **Database**: PostgreSQL (configured in K8s)
- **Object Storage**: MinIO (S3-compatible)
- **Image Processing**: Pillow
- **Server**: Gunicorn
- **Filtering**: django-filter

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Runtime**: Node.js

### Infrastructure
- **Container Orchestration**: Kubernetes (K3S)
- **Container Registry**: Docker
- **GitOps**: ArgoCD
- **Storage**: MinIO, PostgreSQL

## Getting Started

### Prerequisites
- Docker & Docker Compose (for local development)
- Python 3.8+ (for backend development)
- Node.js 16+ (for frontend development)
- kubectl (for Kubernetes deployment)

### Local Development

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Start the development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in terminal)

### Docker Setup

Build and run with Docker Compose:

```bash
docker-compose up --build
```

This will start both the backend and frontend services.

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Obtain JWT token
- `POST /api/auth/refresh/` - Refresh JWT token

### Users
- `GET/POST /api/users/` - List/create users
- `GET/PUT /api/users/{id}/` - Retrieve/update user profile

### Posts
- `GET/POST /api/posts/` - List/create posts
- `GET/DELETE /api/posts/{id}/` - Retrieve/delete post

### Social
- `POST /api/social/follow/` - Follow a user
- `DELETE /api/social/follow/{id}/` - Unfollow a user
- `GET /api/social/followers/` - Get followers

## Kubernetes Deployment

### Prerequisites
- K3S cluster running
- kubectl configured
- Docker images pushed to registry

### Deploy with ArgoCD

1. Apply the ArgoCD configuration:
```bash
kubectl apply -f k8s/argocd/argocd.yaml
```

2. Deploy the application stack:
```bash
kubectl apply -f k8s/postgres/postgres.yaml
kubectl apply -f k8s/minio/minio.yaml
kubectl apply -f k8s/backend/Backend.yaml
kubectl apply -f k8s/frontend/Frontend.yaml
kubectl apply -f k8s/ingress/ingress.yaml
```

### Access the Application

Once deployed, access the application through the ingress URL configured in `k8s/ingress/ingress.yaml`

## Configuration

### Backend Configuration

Edit `backend/config/settings.py` to configure:
- `SECRET_KEY`: Django secret key (use environment variable in production)
- `DEBUG`: Set to `False` in production
- `ALLOWED_HOSTS`: Add your domain
- `DATABASES`: Configure PostgreSQL connection
- `AWS_STORAGE_BUCKET_NAME`: MinIO bucket for image storage

### Frontend Configuration

Edit `frontend/vite.config.ts` for:
- API endpoint configuration
- Build output settings

## Environment Variables

### Backend
- `SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode (True/False)
- `DATABASE_URL`: PostgreSQL connection string
- `AWS_ACCESS_KEY_ID`: MinIO access key
- `AWS_SECRET_ACCESS_KEY`: MinIO secret key
- `AWS_STORAGE_BUCKET_NAME`: MinIO bucket name

### Frontend
- `VITE_API_URL`: Backend API URL

## Development Workflow

1. Create a feature branch
2. Make changes to backend and/or frontend
3. Test locally
4. Build Docker images
5. Push to registry
6. Update Kubernetes manifests
7. Deploy with ArgoCD or kubectl apply

## Common Tasks

### Create a New Post
```bash
curl -X POST http://localhost:8000/api/posts/ \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, NASAT!",
    "image": "path/to/image.jpg"
  }'
```

### Follow a User
```bash
curl -X POST http://localhost:8000/api/social/follow/ \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"following_id": 2}'
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running in Kubernetes
- Check database credentials in settings.py
- Verify network policies allow pod communication

### MinIO Access Issues
- Verify MinIO pod is running: `kubectl get pods -n nasat`
- Check MinIO credentials match in settings.py
- Ensure bucket exists in MinIO

### Frontend API Errors
- Check CORS settings in Django backend
- Verify API_URL matches your backend deployment
- Check browser console for detailed errors

## Contributing

1. Follow PEP 8 for Python code
2. Use TypeScript strict mode for frontend code
3. Write meaningful commit messages
4. Test locally before pushing

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please create an issue in the repository or contact the development team.

---

**Last Updated**: May 2026
