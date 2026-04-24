import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ExternalAuthService {
  private readonly apiKeys = new Map<string, string>(); // Service name -> API Key

  constructor() {
    // In a real app, these would come from env or database
    this.apiKeys.set('weather-api', 'key-123');
    this.apiKeys.set('energy-provider-a', 'auth-token-xyz');
  }

  async getAuthHeaders(serviceName: string): Promise<Record<string, string>> {
    const key = this.apiKeys.get(serviceName);
    if (!key) {
      throw new UnauthorizedException(`No credentials found for service: ${serviceName}`);
    }

    return {
      'Authorization': `Bearer ${key}`,
      'X-API-Source': 'CurrentDao-Gateway',
    };
  }

  validateIncomingRequest(apiKey: string): boolean {
    // Logic to validate incoming requests from third parties if needed
    return Array.from(this.apiKeys.values()).includes(apiKey);
  }
}
