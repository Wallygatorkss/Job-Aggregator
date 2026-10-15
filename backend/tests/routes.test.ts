import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

import skillRoutes from '../src/routes/skillRoutes.js';
import savedOfferRoutes from '../src/routes/savedOfferRoutes.js';
import { generateToken } from '../src/utils/jwt.js';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/skills', skillRoutes);
  app.use('/api/saved-offers', savedOfferRoutes);
  return app;
};

describe('Auth-protected API routes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = buildApp();
  });

  it('GET /api/skills/user without token returns 401', async () => {
    const res = await request(app).get('/api/skills/user');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /api/saved-offers without token returns 401', async () => {
    const res = await request(app).get('/api/saved-offers');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /api/skills/user with malformed token returns 401', async () => {
    const res = await request(app)
      .get('/api/skills/user')
      .set('Authorization', 'Bearer not-a-real-jwt');
    expect(res.status).toBe(401);
  });

  it('generateToken produces a well-formed JWT', () => {
    const token = generateToken({ userId: 1, role: 'user' });
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });
});
