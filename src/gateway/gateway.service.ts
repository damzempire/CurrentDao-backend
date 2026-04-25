import { Injectable } from '@nestjs/common';
import { ExternalApiService } from './integration/external-api.service';
import { HealthMonitorService } from './monitoring/health-monitor.service';

@Injectable()
export class GatewayService {
  private readonly cache = new Map<string, { data: any; expiry: number }>();
  private readonly rateLimits = new Map<string, number[]>();
  private readonly CACHE_TTL = 60000; // 1 minute
  private readonly MAX_REQUESTS = 100; // per 10 seconds

  constructor(
    private readonly externalApi: ExternalApiService,
    private readonly health: HealthMonitorService,
  ) {}

  async proxyRequest(alias: string, endpoint: string, payload?: any) {
    const cacheKey = `${alias}:${endpoint}:${JSON.stringify(payload)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    this.checkRateLimit(alias);

    const result = await this.externalApi.callExternal(alias, endpoint, {
      method: payload ? 'POST' : 'GET',
      body: payload ? JSON.stringify(payload) : undefined,
      headers: { 'Content-Type': 'application/json' },
    });

    this.cache.set(cacheKey, {
      data: result,
      expiry: Date.now() + this.CACHE_TTL,
    });

    return result;
  }

  private checkRateLimit(alias: string) {
    const now = Date.now();
    const windowStart = now - 10000;
    const history = (this.rateLimits.get(alias) || []).filter(t => t > windowStart);
    
    if (history.length >= this.MAX_REQUESTS) {
      throw new Error(`Rate limit exceeded for ${alias}`);
    }

    history.push(now);
    this.rateLimits.set(alias, history);
  }

  getHealthStatus() {
    return this.health.getAllHealth();
  }
}
