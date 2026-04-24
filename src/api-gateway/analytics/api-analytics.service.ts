import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiAnalyticsService {
  private readonly usageStats = new Map<string, number>();

  logRequest(endpoint: string) {
    const count = this.usageStats.get(endpoint) || 0;
    this.usageStats.set(endpoint, count + 1);
  }

  getMetrics() {
    const metrics: Record<string, number> = {};
    this.usageStats.forEach((v, k) => metrics[k] = v);
    return {
      totalRequests: Array.from(this.usageStats.values()).reduce((a, b) => a + b, 0),
      byEndpoint: metrics,
      timestamp: new Date()
    };
  }
}
