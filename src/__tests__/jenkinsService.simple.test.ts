import { JenkinsService } from '../services/jenkinsService';

// Mock axios with a simpler approach
jest.mock('axios', () => ({
  default: jest.fn()
}));

const axios = require('axios');

describe('JenkinsService - Simple Tests', () => {
  let jenkinsService: JenkinsService;

  beforeEach(() => {
    jenkinsService = new JenkinsService();
    jest.clearAllMocks();
  });

  describe('triggerJob', () => {
    it('should trigger a Jenkins job successfully', async () => {
      const mockParameters = { repo: 'test-repo', branch: 'main' };
      const mockResponse = { nextBuildNumber: 123 };

      axios.default.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });

      const result = await jenkinsService.triggerJob(mockParameters);

      expect(result).toEqual({
        id: '123',
        name: 'scan-pipeline',
        status: 'IN_PROGRESS',
        url: 'http://localhost:8080/job/scan-pipeline/123'
      });
    });

    it('should throw error when Jenkins API fails', async () => {
      const mockParameters = { repo: 'test-repo' };
      
      axios.default.mockRejectedValueOnce(new Error('Jenkins API error'));

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

      axios.default.mockResolvedValueOnce({
        data: mockBuildInfo,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
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
  });
}); 