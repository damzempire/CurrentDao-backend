import { Injectable, Logger } from '@nestjs/common';

export interface ServiceHealth {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  latency: number;
  lastCheck: Date;
}

@Injectable()
export class HealthMonitorService {
  private readonly logger = new Logger(HealthMonitorService.name);
  private readonly healthRegistry = new Map<string, ServiceHealth>();

  updateHealth(serviceName: string, health: Partial<ServiceHealth>) {
    const current = this.healthRegistry.get(serviceName) || {
      status: 'UP',
      latency: 0,
      lastCheck: new Date(),
    };

    const updated = { ...current, ...health, lastCheck: new Date() };
    this.healthRegistry.set(serviceName, updated);

    if (updated.status === 'DOWN') {
      this.logger.error(`Service ${serviceName} is DOWN`);
    }
  }

  getHealth(serviceName: string): ServiceHealth | undefined {
    return this.healthRegistry.get(serviceName);
  }

  getAllHealth(): Record<string, ServiceHealth> {
    const result: Record<string, ServiceHealth> = {};
    this.healthRegistry.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}
