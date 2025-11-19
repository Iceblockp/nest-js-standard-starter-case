# Design Document

## Overview

This design document outlines the architecture for a standard NestJS API starter project using NestJS v11.1.9 and Prisma ORM. The project follows a modular, layered architecture with clear separation of concerns. All architectural components are designed to be optional and can be enabled/disabled based on project requirements.

The application uses a simple, maintainable approach without over-engineering, making it suitable as a starter template for various project types.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   CORS   │  │   Rate   │  │  Global  │  │ Validation│   │
│  │          │  │  Limit   │  │  Logger  │  │  Pipeline │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Controller Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Auth      │  │    Users     │  │    Health    │     │
│  │  Controller  │  │  Controller  │  │   Controller │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Auth      │  │    Users     │  │   Config     │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Access Layer                           │
│  ┌──────────────────────────────────────────────────┐       │
│  │              Prisma Client                        │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
nestjs-api-starter/
├── src/
│   ├── main.ts                      # Application entry point
│   ├── app.module.ts                # Root module
│   ├── config/                      # Configuration
│   │   ├── config.module.ts
│   │   ├── config.service.ts
│   │   └── env.validation.ts
│   ├── common/                      # Shared utilities
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── decorators/
│   │   │   └── public.decorator.ts
│   │   └── dto/
│   │       └── pagination.dto.ts
│   ├── modules/
│   │   ├── auth/                    # Authentication module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   ├── users/                   # Users CRUD module
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   ├── health/                  # Health check module
│   │   │   ├── health.module.ts
│   │   │   └── health.controller.ts
│   │   └── prisma/                  # Prisma module
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
├── prisma/
│   ├── schema.prisma                # Prisma schema
│   └── migrations/                  # Database migrations
├── .env.example                     # Environment template
├── .env                             # Local environment (gitignored)
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## Components and Interfaces

### 1. Configuration Module

**Purpose**: Centralized configuration management with environment validation

**Key Components**:

- `ConfigService`: Provides type-safe access to configuration values
- `env.validation.ts`: Validates required environment variables at startup

**Configuration Schema**:

```typescript
interface AppConfig {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string;
  };
  rateLimit: {
    ttl: number;
    limit: number;
  };
}
```

### 2. Prisma Module

**Purpose**: Database access layer using Prisma ORM

**Key Components**:

- `PrismaService`: Extends PrismaClient with NestJS lifecycle hooks
- Handles connection management and graceful shutdown
- Provides global access to Prisma Client

**Design Decisions**:

- Use Prisma as a global module to avoid repeated imports
- Implement `onModuleInit` for connection establishment
- Implement `enableShutdownHooks` for graceful cleanup

### 3. Authentication Module

**Purpose**: JWT-based authentication and authorization

**Key Components**:

- `AuthController`: Handles login, register, and token refresh endpoints
- `AuthService`: Business logic for authentication
- `JwtStrategy`: Passport strategy for JWT validation
- `JwtAuthGuard`: Guard for protecting routes
- `PublicDecorator`: Marks routes as public (bypass auth)

**Authentication Flow**:

```
1. User sends credentials → POST /auth/login
2. AuthService validates credentials
3. Generate JWT token with user payload
4. Return token to client
5. Client includes token in Authorization header
6. JwtStrategy validates token on protected routes
7. User object attached to request
```

### 4. Users Module

**Purpose**: Sample CRUD implementation demonstrating best practices

**Key Components**:

- `UsersController`: RESTful endpoints for user management
- `UsersService`: Business logic and Prisma operations
- DTOs: Request/response validation schemas

**Endpoints**:

- `POST /users` - Create user
- `GET /users` - List users (with pagination)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### 5. Health Check Module

**Purpose**: Application and database health monitoring

**Key Components**:

- `HealthController`: Exposes /health endpoint
- Uses `@nestjs/terminus` for health checks
- Checks database connectivity via Prisma

**Health Response**:

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

### 6. Global Filters and Interceptors

**HTTP Exception Filter**:

- Catches all exceptions
- Returns standardized error format
- Logs errors with context
- Hides stack traces in production

**Logging Interceptor**:

- Logs incoming requests
- Logs response time
- Includes method, path, status code

### 7. Validation Pipeline

**Purpose**: Automatic request validation using class-validator

**Configuration**:

- `whitelist: true` - Strip unknown properties
- `forbidNonWhitelisted: true` - Reject unknown properties
- `transform: true` - Auto-transform to DTO types
- `transformOptions.enableImplicitConversion: true` - Type coercion

### 8. CORS Configuration

**Purpose**: Control cross-origin access

**Configuration**:

- Configurable allowed origins via environment
- Supports credentials
- Allows standard HTTP methods
- Configurable headers

### 9. Rate Limiting (Optional)

**Purpose**: Protect API from abuse

**Implementation**:

- Uses `@nestjs/throttler`
- Configurable TTL and request limit
- Per-IP tracking
- Returns 429 when exceeded

### 10. API Documentation

**Purpose**: Auto-generated OpenAPI documentation

**Implementation**:

- Uses `@nestjs/swagger`
- Available at `/api/docs`
- Decorators on DTOs and controllers
- Includes authentication schemes

## Data Models

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### DTOs

**CreateUserDto**:

```typescript
{
  email: string;        // Required, valid email
  password: string;     // Required, min 8 chars
  firstName?: string;   // Optional
  lastName?: string;    // Optional
}
```

**UpdateUserDto**:

```typescript
{
  email?: string;       // Optional, valid email
  firstName?: string;   // Optional
  lastName?: string;    // Optional
  isActive?: boolean;   // Optional
}
```

**LoginDto**:

```typescript
{
  email: string; // Required, valid email
  password: string; // Required
}
```

**PaginationDto**:

```typescript
{
  page?: number;        // Default: 1
  limit?: number;       // Default: 10, max: 100
}
```

## Error Handling

### Error Response Format

All errors follow a consistent structure:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-11-19T10:30:00.000Z",
  "path": "/users"
}
```

### Error Types

1. **Validation Errors (400)**: Invalid request data
2. **Unauthorized (401)**: Missing or invalid authentication
3. **Forbidden (403)**: Insufficient permissions
4. **Not Found (404)**: Resource doesn't exist
5. **Conflict (409)**: Duplicate resource (e.g., email exists)
6. **Too Many Requests (429)**: Rate limit exceeded
7. **Internal Server Error (500)**: Unexpected errors

### Error Handling Strategy

- Use built-in NestJS exceptions (`BadRequestException`, `NotFoundException`, etc.)
- Global exception filter catches all errors
- Prisma errors mapped to appropriate HTTP status codes
- Sensitive information hidden in production
- All errors logged with context

## Testing Strategy

### Unit Tests

**Scope**: Individual services and utilities

**Approach**:

- Mock Prisma Client for service tests
- Test business logic in isolation
- Focus on edge cases and error handling

**Example Test Cases**:

- AuthService: Valid login, invalid credentials, token generation
- UsersService: CRUD operations, duplicate email handling
- ConfigService: Environment variable validation

### Integration Tests

**Scope**: End-to-end API flows

**Approach**:

- Use test database
- Test complete request/response cycles
- Verify authentication flows
- Test error responses

**Example Test Cases**:

- POST /auth/register → POST /auth/login → GET /users (authenticated)
- Invalid token handling
- Validation error responses
- Health check endpoint

### Test Database

- Use separate PostgreSQL database for tests
- Reset database between test suites
- Use Prisma migrations for test schema

## Security Considerations

1. **Password Security**: Bcrypt hashing with salt rounds (10)
2. **JWT Security**: Strong secret, reasonable expiration (1h)
3. **Input Validation**: All inputs validated via DTOs
4. **SQL Injection**: Prevented by Prisma's parameterized queries
5. **Rate Limiting**: Prevents brute force attacks
6. **CORS**: Restricts allowed origins
7. **Environment Variables**: Sensitive data not hardcoded
8. **Error Messages**: No sensitive information leaked

## Optional Features

The following features can be easily enabled/disabled:

1. **Rate Limiting**: Remove `@nestjs/throttler` and related configuration
2. **Swagger Documentation**: Remove `@nestjs/swagger` setup in main.ts
3. **Authentication**: Remove auth module and guards for public APIs
4. **Logging Interceptor**: Remove from global app configuration
5. **CORS**: Disable in main.ts if not needed

## Deployment Considerations

### Environment Variables

Required variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT signing
- `PORT`: Application port (default: 3000)
- `NODE_ENV`: Environment (development/production)

Optional variables:

- `CORS_ORIGIN`: Allowed origins (default: \*)
- `RATE_LIMIT_TTL`: Rate limit time window (default: 60)
- `RATE_LIMIT_MAX`: Max requests per window (default: 10)

### Database Migrations

- Run `npx prisma migrate deploy` in production
- Use `npx prisma migrate dev` in development
- Keep migrations in version control

### Build and Start

- Build: `npm run build`
- Start: `npm run start:prod`
- Development: `npm run start:dev`

## Technology Stack

- **Framework**: NestJS v11.1.9
- **Runtime**: Node.js (LTS version recommended)
- **Language**: TypeScript
- **ORM**: Prisma (latest version)
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken, passport-jwt)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest (included with NestJS)
- **Rate Limiting**: @nestjs/throttler
- **Health Checks**: @nestjs/terminus
