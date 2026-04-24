import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IntegrationMonitorService {
  private readonly logger = new Logger(IntegrationMonitorService.name);
  private readonly metrics = new Map<string, { success: number; total: number }>();

  logSuccess(provider: string) {
    const m = this.metrics.get(provider) || { success: 0, total: 0 };
    m.success++;
    m.total++;
    this.metrics.set(provider, m);
  }

  logFailure(provider: string, reason: string) {
    const m = this.metrics.get(provider) || { success: 0, total: 0 };
    m.total++;
    this.metrics.set(provider, m);
    this.logger.error(`Integration failure for ${provider}: ${reason}`);
  }

  getAccuracy(provider: string): number {
    const m = this.metrics.get(provider);
    if (!m || m.total === 0) return 100;
    return (m.success / m.total) * 100;
  }
}
