import request from 'supertest';
import express from 'express';

describe('Simple API Test', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Simple test route
    app.get('/test', (req, res) => {
      res.json({ message: 'Hello World' });
    });
  });

  it('should return hello world', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.body).toEqual({ message: 'Hello World' });
  });

  it('should handle 404', async () => {
    const response = await request(app)
      .get('/not-found')
      .expect(404);
  });
}); 