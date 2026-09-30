# OJT Java12 — Project Knowledge Base System

A complete team project knowledge base system for uploading, browsing, searching, and managing project documents, images, and videos with role-based access control.

## Tech Stack
- **Backend:** Java 21, Spring Boot 3.3.4, Maven, Spring Web MVC, Spring Data JPA, Spring Security + JWT, Bean Validation, Lombok, springdoc-openapi (Swagger UI)
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router 7, Axios, react-dropzone
- **Database & Storage:** PostgreSQL 16, Local Disk Storage (`./uploads`) with zero MinIO requirement, plus optional MinIO support (`STORAGE_TYPE=minio`)
- **DevOps:** Docker, Docker Compose, Multi-stage builds, Nginx

---

## Project Structure (Monorepo)

```
OJT_Java12/
├── backend/OJT_Java12_API/     # Spring Boot 3.x, Java 21, Maven
│   ├── src/main/java/com/ojt/java12/
│   │   ├── config/             # SecurityConfig, MinioConfig, OpenApiConfig, DataSeeder
│   │   ├── controller/         # AuthController, UserController, ProjectController, DocumentController
│   │   ├── dto/                # Records: request/ and response/
│   │   ├── entity/             # User, Project, ProjectMember, Document, Role, FileCategory
│   │   ├── middleware/         # JwtAuthenticationFilter, GlobalExceptionHandler
│   │   ├── repository/         # UserRepository, ProjectRepository, ProjectMemberRepository, DocumentRepository
│   │   ├── service/            # AuthService, UserService, ProjectService, DocumentService, StorageService
│   │   ├── service/impl/       # Implementations of services
│   │   └── util/               # JwtUtil, FileValidator, SecurityUtil
│   ├── src/main/resources/     # application.yml
│   ├── pom.xml
│   └── Dockerfile
├── frontend/                   # React + TypeScript + Vite
│   ├── src/
│   │   ├── app/
│   │   │   ├── features/       # auth, projects, documents, profile, admin
│   │   │   ├── services/       # userApi.ts
│   │   │   ├── types/          # auth.ts, user.ts, project.ts, document.ts
│   │   │   └── utils/          # fileHelpers.ts
│   │   ├── shared/             # apiClient.ts, components (Layout, Toast, ConfirmDialog, Pagination), tokenStorage.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick Start (Docker Compose)

Ensure Docker and Docker Compose are installed, then run:

```bash
docker compose up --build
```

### URLs
- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **MinIO Console:** [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`)

---

## Default Administrator Account

The system automatically seeds an administrator account on first startup:
- **Email:** `admin@ojt.com`
- **Password:** `Admin@123456`
- **Role:** `ADMIN`

---

## Features
1. **Authentication & Identity:**
   - User registration (role `USER` by default)
   - Secure login with BCrypt password hashing and JWT access tokens
   - Role-based authorization (`ADMIN`, `OWNER`, `USER`)
2. **Project Management:**
   - Create, edit, and delete projects
   - Add and remove project members by email
   - Strict project access isolation: only members (or admins) see project contents
3. **Document Knowledge Base (MinIO + PostgreSQL):**
   - Drag-and-drop file upload with progress indicator
   - Validated categories:
     - **Documents:** `pdf`, `docx`, `doc`, `xlsx`, `xls`, `pptx`, `ppt`, `md`, `txt`
     - **Images:** `jpg`, `png`, `gif`, `svg`, `bmp`
     - **Videos:** `mp4`, `mov`, `avi`
   - File size validation (up to 50MB)
   - In-browser interactive preview for images, video player, and PDF preview
   - Secure presigned URL downloads
   - Instant search by filename and filter by category
4. **User & Profile Management:**
   - Edit full name and change password
   - Administrator management panel to view, activate/deactivate, promote/demote, and delete users
