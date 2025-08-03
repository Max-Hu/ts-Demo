import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { ValidationError } from '../../middleware/errorHandler';
import { JenkinsService } from '../../services/jenkinsService';
import { ScanJob } from '../../db/models/ScanJob';
import { AuthenticatedRequest } from '../../middleware/apiKeyAuth';

const router = Router();
const jenkinsService = new JenkinsService();

// Validation schemas
const triggerScanSchema = Joi.object({
  scanType: Joi.string().valid('SAST', 'FOSS', 'DAST').required(),
  parameters: Joi.object().required(),
  metadata: Joi.object().optional()
});

const callbackSchema = Joi.object({
  jobId: Joi.string().required(),
  status: Joi.string().valid('completed', 'failed').required(),
  reportUrl: Joi.string().uri().optional(),
  summary: Joi.string().optional(),
  metadata: Joi.object().optional()
});

// POST /api/scan/trigger - Trigger a new scan
router.post('/trigger', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const { error, value } = triggerScanSchema.validate(req.body);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }

    const { scanType, parameters, metadata } = value;

    logger.info('Triggering new scan', { 
      scanType, 
      parameters,
      user: req.user?.apiKey 
    });

    // Create scan job record
    const scanJob = await ScanJob.query().insert({
      id: uuidv4(),
      scanType,
      status: 'pending',
      parameters,
      metadata
    });

    // Trigger Jenkins job
    const jenkinsResponse = await jenkinsService.triggerJob(parameters);

    // Update scan job with Jenkins job ID
    await ScanJob.query()
      .findById(scanJob.id)
      .patch({
        jenkinsJobId: jenkinsResponse.id,
        status: 'running'
      });

    logger.info('Scan triggered successfully', { 
      scanJobId: scanJob.id, 
      jenkinsJobId: jenkinsResponse.id 
    });

    res.status(201).json({
      success: true,
      data: {
        scanJobId: scanJob.id,
        jenkinsJobId: jenkinsResponse.id,
        status: 'running',
        scanType,
        jenkinsUrl: jenkinsResponse.url
      }
    });

  } catch (error: any) {
    logger.error('Failed to trigger scan', { 
      error: error.message, 
      body: req.body 
    });
    
    if (error instanceof ValidationError) {
      res.status(400).json({ 
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to trigger scan' 
      });
    }
  }
});

// POST /api/scan/callback - Jenkins callback with results
router.post('/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate callback data
    const { error, value } = callbackSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      });
    }

    const { jobId, status, reportUrl, summary, metadata } = value;

    logger.info('Received Jenkins callback', { 
      jobId, 
      status, 
      reportUrl 
    });

    // Find scan job by Jenkins job ID
    const scanJob = await ScanJob.query()
      .where('jenkinsJobId', jobId)
      .first();

    if (!scanJob) {
      logger.warn('Scan job not found for Jenkins job ID', { jobId });
      return res.status(404).json({ 
        error: 'Scan job not found' 
      });
    }

    // Update scan job with results
    const updateData: any = {
      status,
      completedAt: new Date()
    };

    if (reportUrl) updateData.reportUrl = reportUrl;
    if (summary) updateData.summary = summary;
    if (metadata) updateData.metadata = { ...scanJob.metadata, ...metadata };

    await ScanJob.query()
      .findById(scanJob.id)
      .patch(updateData);

    logger.info('Scan job updated with callback data', { 
      scanJobId: scanJob.id, 
      status 
    });

    return res.json({
      success: true,
      message: 'Callback processed successfully'
    });

  } catch (error: any) {
    logger.error('Failed to process callback', { 
      error: error.message, 
      body: req.body 
    });
    
    if (error instanceof ValidationError) {
      return res.status(400).json({ 
        error: error.message 
      });
    } else {
      return res.status(500).json({ 
        error: 'Failed to process callback' 
      });
    }
  }
});

// GET /api/scan/status/:id - Get scan job status
router.get('/status/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const scanJob = await ScanJob.query().findById(id);
    if (!scanJob) {
      return res.status(404).json({ 
        error: 'Scan job not found' 
      });
    }

    // If job is running, check Jenkins status
    if (scanJob.status === 'running' && scanJob.jenkinsJobId) {
      try {
        const jenkinsInfo = await jenkinsService.getBuildInfo(scanJob.jenkinsJobId);
        
        // Update status if it has changed
        if (jenkinsInfo.status === 'SUCCESS' && scanJob.status !== 'completed') {
          await ScanJob.query()
            .findById(id)
            .patch({ 
              status: 'completed' as const,
              completedAt: new Date()
            });
          (scanJob as any).status = 'completed';
        } else if (jenkinsInfo.status === 'FAILURE' && scanJob.status !== 'failed') {
          await ScanJob.query()
            .findById(id)
            .patch({ 
              status: 'failed' as const,
              completedAt: new Date()
            });
          (scanJob as any).status = 'failed';
        }
      } catch (jenkinsError) {
        logger.warn('Failed to check Jenkins status', { 
          scanJobId: id, 
          jenkinsJobId: scanJob.jenkinsJobId,
          error: jenkinsError 
        });
      }
    }

    return res.json({
      success: true,
      data: {
        id: scanJob.id,
        scanType: scanJob.scanType,
        status: scanJob.status,
        jenkinsJobId: scanJob.jenkinsJobId,
        reportUrl: scanJob.reportUrl,
        summary: scanJob.summary,
        metadata: scanJob.metadata,
        createdAt: scanJob.createdAt,
        updatedAt: scanJob.updatedAt,
        completedAt: scanJob.completedAt
      }
    });

  } catch (error: any) {
    logger.error('Failed to get scan status', { 
      error: error.message, 
      scanJobId: req.params.id 
    });
    return res.status(500).json({ 
      error: 'Failed to get scan status' 
    });
  }
});

export { router as scanRoutes }; 