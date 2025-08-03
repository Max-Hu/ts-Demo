import { v4 as uuidv4 } from 'uuid';
import { ScanJob } from '../db/models/ScanJob';
import { JenkinsService } from '../services/jenkinsService';
import { logger } from '../utils/logger';

const jenkinsService = new JenkinsService();

export const graphqlResolvers = {
  Query: {
    scanJob: async (_: any, { id }: { id: string }) => {
      try {
        const scanJob = await ScanJob.query().findById(id);
        if (!scanJob) {
          throw new Error('Scan job not found');
        }

        let log = '';
        // Get Jenkins console output if job is running or completed
        if (scanJob.jenkinsJobId && (scanJob.status === 'running' || scanJob.status === 'completed')) {
          try {
            log = await jenkinsService.getConsoleOutput(scanJob.jenkinsJobId);
          } catch (error) {
            logger.warn('Failed to get console output for GraphQL query', { 
              scanJobId: id, 
              error 
            });
          }
        }

        return {
          id: scanJob.id,
          scanType: scanJob.scanType,
          status: scanJob.status,
          jenkinsJobId: scanJob.jenkinsJobId,
          reportUrl: scanJob.reportUrl,
          summary: scanJob.summary,
          metadata: scanJob.metadata ? JSON.stringify(scanJob.metadata) : null,
          log,
          createdAt: scanJob.createdAt.toISOString(),
          updatedAt: scanJob.updatedAt.toISOString(),
          completedAt: scanJob.completedAt?.toISOString() || null
        };
      } catch (error: any) {
        logger.error('GraphQL scanJob query failed', { 
          scanJobId: id, 
          error: error.message 
        });
        throw error;
      }
    },

    scanJobs: async (_: any, { limit, offset }: { limit: number; offset: number }) => {
      try {
        const scanJobs = await ScanJob.query()
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .offset(offset);

        return scanJobs.map(job => ({
          id: job.id,
          jenkinsJobId: job.jenkinsJobId,
          scanType: job.scanType,
          status: job.status,
          parameters: JSON.stringify(job.parameters),
          reportUrl: job.reportUrl,
          summary: job.summary,
          metadata: job.metadata ? JSON.stringify(job.metadata) : null,
          createdAt: job.createdAt.toISOString(),
          updatedAt: job.updatedAt.toISOString(),
          completedAt: job.completedAt?.toISOString() || null
        }));
      } catch (error: any) {
        logger.error('GraphQL scanJobs query failed', { 
          error: error.message 
        });
        throw error;
      }
    }
  },

  Mutation: {
    triggerScan: async (_: any, { scanType, parameters, metadata }: { 
      scanType: string; 
      parameters: string; 
      metadata?: string 
    }) => {
      try {
        const parsedParameters = JSON.parse(parameters);
        const parsedMetadata = metadata ? JSON.parse(metadata) : {};

        logger.info('GraphQL: Triggering new scan', { 
          scanType, 
          parameters: parsedParameters 
        });

        // Create scan job record
        const scanJob = await ScanJob.query().insert({
          id: uuidv4(),
          scanType: scanType as 'SAST' | 'FOSS' | 'DAST',
          status: 'pending',
          parameters: parsedParameters,
          metadata: parsedMetadata
        });

        // Trigger Jenkins job
        const jenkinsResponse = await jenkinsService.triggerJob(parsedParameters);

        // Update scan job with Jenkins job ID
        await ScanJob.query()
          .findById(scanJob.id)
          .patch({
            jenkinsJobId: jenkinsResponse.id,
            status: 'running'
          });

        logger.info('GraphQL: Scan triggered successfully', { 
          scanJobId: scanJob.id, 
          jenkinsJobId: jenkinsResponse.id 
        });

        return {
          id: scanJob.id,
          jenkinsJobId: jenkinsResponse.id,
          scanType: scanJob.scanType,
          status: 'running',
          parameters: JSON.stringify(scanJob.parameters),
          reportUrl: null,
          summary: null,
          metadata: scanJob.metadata ? JSON.stringify(scanJob.metadata) : null,
          createdAt: scanJob.createdAt.toISOString(),
          updatedAt: scanJob.updatedAt.toISOString(),
          completedAt: null
        };
      } catch (error: any) {
        logger.error('GraphQL triggerScan mutation failed', { 
          error: error.message,
          scanType,
          parameters 
        });
        throw error;
      }
    }
  }
}; 