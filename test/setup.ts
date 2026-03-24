import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

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

// Mock TypeORM
jest.mock('typeorm', () => ({
  Entity: () => (target: any) => target,
  PrimaryGeneratedColumn: () => (target: any, propertyKey: string) => {},
  Column: () => (target: any, propertyKey: string) => {},
  CreateDateColumn: () => (target: any, propertyKey: string) => {},
  UpdateDateColumn: () => (target: any, propertyKey: string) => {},
  Index: () => (target: any) => {},
  getRepository: jest.fn(),
}));

// Global test setup
beforeAll(async () => {
  // Set up any global test configuration
});

afterAll(async () => {
  // Clean up any global test configuration
});
