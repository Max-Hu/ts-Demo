import request from 'supertest';
import express from 'express';
import { scanRoutes } from '../api/routes/scanRoutes';
import { apiKeyAuth } from '../middleware/apiKeyAuth';
import { errorHandler } from '../middleware/errorHandler';
import { ScanJob } from '../db/models/ScanJob';
import { JenkinsService } from '../services/jenkinsService';

// Mock dependencies
jest.mock('../db/models/ScanJob');
jest.mock('../services/jenkinsService');

const MockedScanJob = ScanJob as jest.MockedClass<typeof ScanJob>;
const MockedJenkinsService = JenkinsService as jest.MockedClass<typeof JenkinsService>;

describe('Scan API Routes', () => {
  let app: express.Application;
  let mockJenkinsService: jest.Mocked<JenkinsService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/scan', apiKeyAuth, scanRoutes);
    app.use(errorHandler);

    // Mock Jenkins service
    mockJenkinsService = {
      triggerJob: jest.fn(),
      getBuildInfo: jest.fn(),
      getConsoleOutput: jest.fn(),
      isJobRunning: jest.fn()
    } as any;

    // Set up environment variables for testing
    process.env.API_KEY = 'test-api-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/scan/trigger', () => {
    it('should trigger a scan successfully', async () => {
      const mockScanJob = {
        id: 'test-scan-id',
        scanType: 'SAST',
        status: 'pending',
        parameters: { repo: 'test-repo' },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockJenkinsResponse = {
        id: '123',
        name: 'scan-pipeline',
        status: 'IN_PROGRESS',
        url: 'http://localhost:8080/job/scan-pipeline/123'
      };

      (MockedScanJob.query as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue(mockScanJob),
        findById: jest.fn().mockReturnValue({
          patch: jest.fn().mockResolvedValue(undefined)
        })
      } as any);

      MockedJenkinsService.prototype.triggerJob = jest.fn().mockResolvedValue(mockJenkinsResponse);

      const response = await request(app)
        .post('/api/scan/trigger')
        .set('x-api-key', 'test-api-key')
        .send({
          scanType: 'SAST',
          parameters: { repo: 'test-repo' },
          metadata: {}
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          scanJobId: 'test-scan-id',
          jenkinsJobId: '123',
          status: 'running',
          scanType: 'SAST',
          jenkinsUrl: 'http://localhost:8080/job/scan-pipeline/123'
        }
      });
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .post('/api/scan/trigger')
        .send({
          scanType: 'SAST',
          parameters: { repo: 'test-repo' }
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('API key required');
    });

    it('should return 403 when API key is invalid', async () => {
      const response = await request(app)
        .post('/api/scan/trigger')
        .set('x-api-key', 'invalid-key')
        .send({
          scanType: 'SAST',
          parameters: { repo: 'test-repo' }
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid API key');
    });

    it('should return 400 when request body is invalid', async () => {
      const response = await request(app)
        .post('/api/scan/trigger')
        .set('x-api-key', 'test-api-key')
        .send({
          scanType: 'INVALID_TYPE',
          parameters: {}
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('scanType');
    });
  });

  describe('POST /api/scan/callback', () => {
    it('should process callback successfully', async () => {
      const mockScanJob = {
        id: 'test-scan-id',
        jenkinsJobId: '123',
        scanType: 'SAST',
        status: 'running',
        parameters: { repo: 'test-repo' },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (MockedScanJob.query as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(mockScanJob)
        }),
        findById: jest.fn().mockReturnValue({
          patch: jest.fn().mockResolvedValue(undefined)
        })
      } as any);

      const response = await request(app)
        .post('/api/scan/callback')
        .send({
          jobId: '123',
          status: 'completed',
          reportUrl: 'http://example.com/report',
          summary: 'Scan completed successfully'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Callback processed successfully'
      });
    });

    it('should return 404 when scan job not found', async () => {
      (MockedScanJob.query as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null)
        })
      } as any);

      const response = await request(app)
        .post('/api/scan/callback')
        .send({
          jobId: '999',
          status: 'completed'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Scan job not found');
    });
  });

  describe('GET /api/scan/status/:id', () => {
    it('should return scan job status', async () => {
      const mockScanJob = {
        id: 'test-scan-id',
        jenkinsJobId: '123',
        scanType: 'SAST',
        status: 'completed',
        parameters: { repo: 'test-repo' },
        reportUrl: 'http://example.com/report',
        summary: 'Scan completed',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date()
      };

      (MockedScanJob.query as jest.Mock).mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockScanJob)
      } as any);

      const response = await request(app)
        .get('/api/scan/status/test-scan-id');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('test-scan-id');
      expect(response.body.data.status).toBe('completed');
    });

    it('should return 404 when scan job not found', async () => {
      (MockedScanJob.query as jest.Mock).mockReturnValue({
        findById: jest.fn().mockResolvedValue(null)
      } as any);

      const response = await request(app)
        .get('/api/scan/status/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Scan job not found');
    });
  });
}); 