import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('API Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test database
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Clean up test database
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET) should return healthy status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.info.database.status).toBe('up');
        });
    });
  });

  describe('Authentication Flow', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('/auth/register (POST) should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user.password).toBeUndefined();
          expect(res.body.access_token).toBeDefined();
          testUserId = res.body.user.id;
        });
    });

    it('/auth/register (POST) should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('/auth/login (POST) should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe(testUser.email);
          authToken = res.body.access_token;
        });
    });

    it('/auth/login (POST) should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('/users (GET) should fail without authentication', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });

    it('/users (GET) should succeed with valid token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(res.body.meta).toBeDefined();
        });
    });
  });

  describe('Users CRUD Operations', () => {
    let createdUserId: string;

    it('/users (POST) should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.email).toBe('newuser@example.com');
          expect(res.body.firstName).toBe('New');
          expect(res.body.password).toBeUndefined();
          createdUserId = res.body.id;
        });
    });

    it('/users (GET) should return paginated users', () => {
      return request(app.getHttpServer())
        .get('/users?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);
          expect(res.body.meta).toBeDefined();
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(10);
        });
    });

    it('/users/:id (GET) should return a specific user', () => {
      return request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdUserId);
          expect(res.body.email).toBe('newuser@example.com');
        });
    });

    it('/users/:id (PATCH) should update a user', () => {
      return request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.firstName).toBe('Updated');
          expect(res.body.lastName).toBe('Name');
        });
    });

    it('/users/:id (DELETE) should delete a user', () => {
      return request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/users/:id (GET) should return 404 for deleted user', () => {
      return request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Validation Errors', () => {
    it('/auth/register (POST) should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400)
        .expect((res) => {
          expect(
            Array.isArray(res.body.message)
              ? res.body.message.join(' ')
              : res.body.message,
          ).toContain('email');
        });
    });

    it('/auth/register (POST) should fail with short password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'short',
        })
        .expect(400)
        .expect((res) => {
          expect(
            Array.isArray(res.body.message)
              ? res.body.message.join(' ')
              : res.body.message,
          ).toContain('password');
        });
    });

    it('/auth/login (POST) should fail with missing fields', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('/users (POST) should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'not-an-email',
          password: '123',
        })
        .expect(400);
    });

    it('/users (GET) should fail with invalid pagination params', () => {
      return request(app.getHttpServer())
        .get('/users?page=-1&limit=1000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(request(app.getHttpServer()).get('/health').expect(200));
      }
      await Promise.all(requests);
    });

    it('should return 429 when rate limit is exceeded', async () => {
      // Make sequential requests to the same endpoint rapidly
      // Note: Rate limiting behavior may vary based on configuration
      const responses = [];

      for (let i = 0; i < 150; i++) {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123',
          });
        responses.push(res);

        // If we hit rate limit, we can stop
        if (res.status === 429) {
          break;
        }
      }

      const rateLimited = responses.some((res) => res.status === 429);
      // Rate limiting should eventually kick in
      expect(rateLimited).toBe(true);
    }, 60000); // Increase timeout for this test
  });
});
