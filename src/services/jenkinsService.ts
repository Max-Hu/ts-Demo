import axios, { AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { JenkinsError } from '../middleware/errorHandler';

export interface JenkinsJobResponse {
  id: string;
  name: string;
  status: string;
  url: string;
}

export interface JenkinsBuildInfo {
  id: string;
  status: 'SUCCESS' | 'FAILURE' | 'ABORTED' | 'IN_PROGRESS';
  result?: string;
  consoleOutput?: string;
  url: string;
  timestamp: number;
}

export class JenkinsService {
  private baseUrl: string;
  private username: string;
  private token: string;
  private jobName: string;

  constructor() {
    this.baseUrl = process.env.JENKINS_URL || 'http://localhost:8080';
    this.username = process.env.JENKINS_USER || 'admin';
    this.token = process.env.JENKINS_TOKEN || '';
    this.jobName = process.env.JENKINS_JOB_NAME || 'scan-pipeline';
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.username}:${this.token}`).toString('base64');
    return `Basic ${credentials}`;
  }

  private async makeRequest<T>(url: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<T> {
    try {
      const config = {
        method,
        url: `${this.baseUrl}${url}`,
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data
      };

      logger.debug('Making Jenkins request', { url, method });
      const response: AxiosResponse<T> = await axios(config);
      return response.data;
    } catch (error: any) {
      logger.error('Jenkins API request failed', {
        url,
        method,
        error: error.message,
        status: error.response?.status
      });
      throw new JenkinsError(`Jenkins API request failed: ${error.message}`);
    }
  }

  async triggerJob(parameters: Record<string, any>): Promise<JenkinsJobResponse> {
    const url = `/job/${this.jobName}/buildWithParameters`;
    
    // Convert parameters to Jenkins format
    const jenkinsParams = Object.entries(parameters).map(([key, value]) => 
      `${key}=${encodeURIComponent(String(value))}`
    ).join('&');

    const fullUrl = `${url}?${jenkinsParams}`;
    
    logger.info('Triggering Jenkins job', { 
      jobName: this.jobName, 
      parameters 
    });

    await this.makeRequest(fullUrl, 'POST');
    
    // Get the latest build number
    const jobInfo = await this.makeRequest<{ nextBuildNumber: number }>(`/job/${this.jobName}/api/json?tree=nextBuildNumber`);
    
    return {
      id: jobInfo.nextBuildNumber.toString(),
      name: this.jobName,
      status: 'IN_PROGRESS',
      url: `${this.baseUrl}/job/${this.jobName}/${jobInfo.nextBuildNumber}`
    };
  }

  async getBuildInfo(buildNumber: string): Promise<JenkinsBuildInfo> {
    const url = `/job/${this.jobName}/${buildNumber}/api/json?tree=id,result,building,timestamp,url`;
    
    logger.debug('Getting build info', { buildNumber });
    
    const buildInfo = await this.makeRequest<{
      id: string;
      result: string | null;
      building: boolean;
      timestamp: number;
      url: string;
    }>(url);

    let status: JenkinsBuildInfo['status'];
    if (buildInfo.building) {
      status = 'IN_PROGRESS';
    } else if (buildInfo.result === 'SUCCESS') {
      status = 'SUCCESS';
    } else if (buildInfo.result === 'FAILURE') {
      status = 'FAILURE';
    } else {
      status = 'ABORTED';
    }

    return {
      id: buildInfo.id,
      status,
      result: buildInfo.result || undefined,
      url: buildInfo.url,
      timestamp: buildInfo.timestamp
    };
  }

  async getConsoleOutput(buildNumber: string): Promise<string> {
    const url = `/job/${this.jobName}/${buildNumber}/consoleText`;
    
    logger.debug('Getting console output', { buildNumber });
    
    try {
      const response = await axios.get(`${this.baseUrl}${url}`, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get console output', {
        buildNumber,
        error: error.message
      });
      throw new JenkinsError(`Failed to get console output: ${error.message}`);
    }
  }

  async isJobRunning(buildNumber: string): Promise<boolean> {
    try {
      const buildInfo = await this.getBuildInfo(buildNumber);
      return buildInfo.status === 'IN_PROGRESS';
    } catch (error) {
      logger.error('Failed to check job status', { buildNumber, error });
      return false;
    }
  }
} 