// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_DATABASE = 'test_currentdao';
process.env.WEATHER_API_KEY = 'test_weather_key';
process.env.FRED_API_KEY = 'test_fred_key';
process.env.ALPHA_VANTAGE_API_KEY = 'test_alpha_vantage_key';

// Mock external API calls
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// Global test setup
beforeAll(() => {
  // Set up any global test configuration
});

afterAll(() => {
  // Clean up any global test configuration
});
