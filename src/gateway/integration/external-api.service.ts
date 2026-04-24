import { Injectable, Logger } from '@nestjs/common';
import { ApiRouterService } from '../routing/api-router.service';
import { ExternalAuthService } from '../security/external-auth.service';
import { HealthMonitorService } from '../monitoring/health-monitor.service';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';

@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);

  constructor(
    private readonly router: ApiRouterService,
    private readonly auth: ExternalAuthService,
    private readonly health: HealthMonitorService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  async callExternal<T>(alias: string, endpoint: string, options: any = {}): Promise<T> {
    const route = this.router.resolveRoute(alias);
    const headers = await this.auth.getAuthHeaders(route.serviceName);

    const startTime = Date.now();

    return this.circuitBreaker.execute(route.serviceName, async () => {
      try {
        const response = await fetch(`${route.baseUrl}${endpoint}`, {
          ...options,
          headers: { ...options.headers, ...headers },
        });

        const latency = Date.now() - startTime;
        
        if (!response.ok) {
          this.health.updateHealth(route.serviceName, { status: 'DEGRADED', latency });
          throw new Error(`External API error: ${response.statusText}`);
        }

        const data = await response.json();
        this.health.updateHealth(route.serviceName, { status: 'UP', latency });
        return data;
      } catch (error) {
        const latency = Date.now() - startTime;
        this.health.updateHealth(route.serviceName, { status: 'DOWN', latency });
        this.logger.error(`Failed to call ${route.serviceName}: ${error.message}`);
        throw error;
      }
    });
  }
}
