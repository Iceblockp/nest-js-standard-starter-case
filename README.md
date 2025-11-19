# NestJS API Starter

A production-ready NestJS API starter template with authentication, database integration, and optional architectural components. Built with NestJS v11.1.9 and Prisma ORM.

## Features

- **Modular Architecture**: Clean separation of concerns with feature modules
- **JWT Authentication**: Secure authentication with JWT tokens and bcrypt password hashing
- **Database Integration**: Prisma ORM with PostgreSQL and type-safe queries
- **Validation**: Automatic request validation using class-validator
- **Error Handling**: Standardized error responses with global exception filter
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Health Checks**: Database connectivity monitoring
- **Rate Limiting**: Configurable request throttling (optional)
- **CORS Support**: Configurable cross-origin resource sharing
- **Logging**: Request/response logging with interceptors
- **Testing**: Unit and integration tests with Jest

## Prerequisites

- Node.js (LTS version recommended)
- PostgreSQL database
- npm or yarn package manager

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd nestjs-api-starter

# Install dependencies
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables) section below).

### 3. Database Setup

```bash
# Run database migrations
npx prisma migrate dev

# Seed the database with sample data (optional)
npm run seed
```

The seed script creates sample users for testing (password: `Password123!`):

- `admin@example.com` - Admin User (active)
- `john.doe@example.com` - John Doe (active)
- `jane.smith@example.com` - Jane Smith (active)
- `inactive@example.com` - Inactive User (inactive)

### 4. Start the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

### 5. Access API Documentation

Open your browser and navigate to:

- Swagger UI: `http://localhost:3000/api/docs`

## Environment Variables

### Required Variables

| Variable         | Description                  | Example                                            |
| ---------------- | ---------------------------- | -------------------------------------------------- |
| `NODE_ENV`       | Application environment      | `development`, `production`                        |
| `PORT`           | Server port                  | `3000`                                             |
| `DATABASE_URL`   | PostgreSQL connection string | `postgresql://user:password@localhost:5432/dbname` |
| `JWT_SECRET`     | Secret key for JWT signing   | `your-super-secret-jwt-key`                        |
| `JWT_EXPIRES_IN` | JWT token expiration time    | `1h`, `7d`, `30d`                                  |

### Optional Variables

| Variable         | Description                            | Default |
| ---------------- | -------------------------------------- | ------- |
| `CORS_ORIGIN`    | Allowed CORS origins (comma-separated) | `*`     |
| `RATE_LIMIT_TTL` | Rate limit time window (seconds)       | `60`    |
| `RATE_LIMIT_MAX` | Max requests per time window           | `10`    |

### Example Configuration

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nestjs_starter?schema=public

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=10
```

## API Endpoints

### Authentication

| Method | Endpoint         | Description                 | Auth Required |
| ------ | ---------------- | --------------------------- | ------------- |
| POST   | `/auth/register` | Register a new user         | No            |
| POST   | `/auth/login`    | Login and receive JWT token | No            |

### Users

| Method | Endpoint     | Description                | Auth Required |
| ------ | ------------ | -------------------------- | ------------- |
| POST   | `/users`     | Create a new user          | Yes           |
| GET    | `/users`     | List all users (paginated) | Yes           |
| GET    | `/users/:id` | Get user by ID             | Yes           |
| PATCH  | `/users/:id` | Update user                | Yes           |
| DELETE | `/users/:id` | Delete user                | Yes           |

### Health

| Method | Endpoint  | Description                           | Auth Required |
| ------ | --------- | ------------------------------------- | ------------- |
| GET    | `/health` | Check application and database health | No            |

### Authentication Flow

1. **Register**: POST to `/auth/register` with email and password
2. **Login**: POST to `/auth/login` to receive JWT token
3. **Access Protected Routes**: Include token in `Authorization` header as `Bearer <token>`

Example:

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!","firstName":"John","lastName":"Doe"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}'

# Access protected endpoint
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Database Management

### Running Migrations

```bash
# Development: Create and apply migration
npx prisma migrate dev --name migration_name

# Production: Apply existing migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Prisma Studio

Access the Prisma Studio GUI to view and edit data:

```bash
npx prisma studio
```

Opens at `http://localhost:5555`

### Database Schema

The starter includes a User model:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

To add new models:

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_migration_name`
3. Generate Prisma Client: `npx prisma generate`

## Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

### Integration Tests

```bash
# Run e2e tests (automatically sets up test database)
npm run test:e2e
```

The integration tests:

- Use a separate test database (configured in `.env.test`)
- Automatically run migrations before tests
- Clean up test data after each suite
- Test complete authentication and CRUD flows

### Test Database Setup

Create a `.env.test` file for test environment:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/nestjs_starter_test?schema=public
NODE_ENV=test
JWT_SECRET=test-secret
```

## Optional Features

The starter includes optional features that can be easily enabled or disabled:

### Rate Limiting

**Enabled by default**. To disable:

1. Remove `ThrottlerModule` from `app.module.ts`
2. Remove `ThrottlerGuard` from global providers
3. Uninstall: `npm uninstall @nestjs/throttler`

### Swagger Documentation

**Enabled by default**. To disable:

1. Remove Swagger setup from `src/main.ts`
2. Remove `@nestjs/swagger` decorators from DTOs and controllers
3. Uninstall: `npm uninstall @nestjs/swagger`

### Authentication

To create a public API without authentication:

1. Remove `JwtAuthGuard` from global providers in `app.module.ts`
2. Remove auth module if not needed
3. Remove `@UseGuards(JwtAuthGuard)` from controllers

### Logging Interceptor

**Enabled by default**. To disable:

1. Remove `LoggingInterceptor` from global providers in `app.module.ts`

### CORS

**Enabled by default**. To disable:

1. Remove or modify CORS configuration in `src/main.ts`

## Project Structure

```
nestjs-api-starter/
├── src/
│   ├── main.ts                      # Application entry point
│   ├── app.module.ts                # Root module
│   ├── config/                      # Configuration management
│   │   ├── config.module.ts
│   │   ├── config.service.ts
│   │   └── env.validation.ts
│   ├── common/                      # Shared utilities
│   │   ├── filters/                 # Exception filters
│   │   ├── interceptors/            # Request/response interceptors
│   │   ├── guards/                  # Route guards
│   │   ├── decorators/              # Custom decorators
│   │   └── dto/                     # Shared DTOs
│   └── modules/                     # Feature modules
│       ├── auth/                    # Authentication
│       ├── users/                   # User management
│       ├── health/                  # Health checks
│       └── prisma/                  # Database service
├── prisma/
│   ├── schema.prisma                # Database schema
│   ├── migrations/                  # Database migrations
│   └── seed.ts                      # Database seeding
├── test/                            # Integration tests
├── .env                             # Environment variables (gitignored)
├── .env.example                     # Environment template
└── .env.test                        # Test environment
```

## Deployment

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET` (minimum 32 characters)
3. Configure `DATABASE_URL` for production database
4. Set appropriate `CORS_ORIGIN` (avoid using `*` in production)
5. Adjust rate limiting based on your needs

### Database Migrations

In production, use `migrate deploy` instead of `migrate dev`:

```bash
npx prisma migrate deploy
```

This applies pending migrations without prompting for input.

### Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

Build and run:

```bash
docker build -t nestjs-api .
docker run -p 3000:3000 --env-file .env nestjs-api
```

### Health Checks

Use the `/health` endpoint for container health checks and load balancer monitoring:

```bash
curl http://localhost:3000/health
```

Returns:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" }
  }
}
```

## Security Considerations

- **Passwords**: Hashed using bcrypt with 10 salt rounds
- **JWT Tokens**: Use strong secrets and reasonable expiration times
- **Input Validation**: All inputs validated via DTOs
- **SQL Injection**: Protected by Prisma's parameterized queries
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configure allowed origins appropriately
- **Environment Variables**: Never commit `.env` files
- **Error Messages**: Sensitive information hidden in production

## Development Scripts

```bash
# Start development server with hot reload
npm run start:dev

# Format code with Prettier
npm run format

# Lint code with ESLint
npm run lint

# Run unit tests
npm run test

# Run integration tests
npm run test:e2e

# Generate test coverage
npm run test:cov

# Build for production
npm run build

# Seed database
npm run seed
```

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check `DATABASE_URL` format and credentials
- Ensure database exists: `createdb nestjs_starter`
- Check firewall/network settings

### Migration Errors

```bash
# Reset database and reapply migrations
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

### Port Already in Use

Change the `PORT` in `.env` or kill the process using port 3000:

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

### JWT Token Issues

- Verify `JWT_SECRET` matches between environments
- Check token expiration time
- Ensure token is sent in `Authorization: Bearer <token>` format

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
- [Class Validator](https://github.com/typestack/class-validator)

## License

This project is [MIT licensed](LICENSE).
