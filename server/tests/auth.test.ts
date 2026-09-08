import request from 'supertest';
import app from '../src/server';
import User from '../src/models/User';

describe('Authentication & User Profile API', () => {
  const testUser = {
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    password: 'Password123!',
    currentLevel: 'advanced',
    learningGoals: ['Master Distributed Systems'],
    preferences: {
      theme: 'dark',
      preferredLearningStyle: 'visual',
      dailyGoalMinutes: 45,
    },
  };

  it('should successfully register a new user and return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.name).toBe(testUser.name);
    expect(res.body.user.passwordHash).toBeUndefined(); // Never expose password hash
  });

  it('should reject registration with an existing email', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should authenticate a registered user via login', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'wrong_password',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should fetch authenticated user profile at /api/auth/me', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.preferences.preferredLearningStyle).toBe('visual');
  });
});
