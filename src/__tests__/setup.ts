// Test setup file for Jest
// Global test setup
beforeAll(() => {
  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.API_KEY = 'test-api-key';
  process.env.LOG_LEVEL = 'error';
});

// Global test cleanup
afterAll(() => {
  // Clean up any global state
}); 