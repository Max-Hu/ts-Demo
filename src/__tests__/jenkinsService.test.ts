import { JenkinsService } from '../services/jenkinsService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('JenkinsService', () => {
  let jenkinsService: JenkinsService;

  beforeEach(() => {
    jenkinsService = new JenkinsService();
    jest.clearAllMocks();
  });

  describe('triggerJob', () => {
    it('should trigger a Jenkins job successfully', async () => {
      const mockParameters = { repo: 'test-repo', branch: 'main' };
      const mockResponse = { nextBuildNumber: 123 };

      (mockedAxios as any).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await jenkinsService.triggerJob(mockParameters);

      expect(result).toEqual({
        id: '123',
        name: 'scan-pipeline',
        status: 'IN_PROGRESS',
        url: 'http://localhost:8080/job/scan-pipeline/123'
      });

      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://localhost:8080/job/scan-pipeline/buildWithParameters?repo=test-repo&branch=main',
        headers: {
          'Authorization': expect.any(String),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: undefined
      });
    });

    it('should throw error when Jenkins API fails', async () => {
      const mockParameters = { repo: 'test-repo' };
      
      (mockedAxios as any).mockRejectedValueOnce(new Error('Jenkins API error'));

      await expect(jenkinsService.triggerJob(mockParameters)).rejects.toThrow('Jenkins API request failed: Jenkins API error');
    });
  });

  describe('getBuildInfo', () => {
    it('should return build info for running job', async () => {
      const mockBuildInfo = {
        id: '123',
        result: null,
        building: true,
        timestamp: 1234567890,
        url: 'http://localhost:8080/job/scan-pipeline/123'
      };

      (mockedAxios as any).mockResolvedValueOnce({
        data: mockBuildInfo,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await jenkinsService.getBuildInfo('123');

      expect(result).toEqual({
        id: '123',
        status: 'IN_PROGRESS',
        result: undefined,
        url: 'http://localhost:8080/job/scan-pipeline/123',
        timestamp: 1234567890
      });
    });

    it('should return build info for completed job', async () => {
      const mockBuildInfo = {
        id: '123',
        result: 'SUCCESS',
        building: false,
        timestamp: 1234567890,
        url: 'http://localhost:8080/job/scan-pipeline/123'
      };

      (mockedAxios as any).mockResolvedValueOnce({
        data: mockBuildInfo,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await jenkinsService.getBuildInfo('123');

      expect(result).toEqual({
        id: '123',
        status: 'SUCCESS',
        result: 'SUCCESS',
        url: 'http://localhost:8080/job/scan-pipeline/123',
        timestamp: 1234567890
      });
    });
  });

  describe('getConsoleOutput', () => {
    it('should return console output', async () => {
      const mockConsoleOutput = 'Build started...\nBuild completed successfully';

      (mockedAxios as any).mockResolvedValueOnce({
        data: mockConsoleOutput,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await jenkinsService.getConsoleOutput('123');

      expect(result).toBe(mockConsoleOutput);
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://localhost:8080/job/scan-pipeline/123/consoleText',
        headers: {
          'Authorization': expect.any(String)
        }
      });
    });
  });

  describe('isJobRunning', () => {
    it('should return true for running job', async () => {
      const mockBuildInfo = {
        id: '123',
        result: null,
        building: true,
        timestamp: 1234567890,
        url: 'http://localhost:8080/job/scan-pipeline/123'
      };

      (mockedAxios as any).mockResolvedValueOnce({
        data: mockBuildInfo,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await jenkinsService.isJobRunning('123');

      expect(result).toBe(true);
    });

    it('should return false for completed job', async () => {
      const mockBuildInfo = {
        id: '123',
        result: 'SUCCESS',
        building: false,
        timestamp: 1234567890,
        url: 'http://localhost:8080/job/scan-pipeline/123'
      };

      (mockedAxios as any).mockResolvedValueOnce({
        data: mockBuildInfo,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await jenkinsService.isJobRunning('123');

      expect(result).toBe(false);
    });

    it('should return false when API fails', async () => {
      (mockedAxios as any).mockRejectedValueOnce(new Error('API error'));

      const result = await jenkinsService.isJobRunning('123');

      expect(result).toBe(false);
    });
  });
}); 