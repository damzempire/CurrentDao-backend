import { Injectable } from '@nestjs/common';
import { GatewayService } from '../../gateway/gateway.service';
import { IntegrationMonitorService } from '../monitoring/integration-monitor.service';

@Injectable()
export class RegulatoryServiceService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly monitor: IntegrationMonitorService,
  ) {}

  async checkCompliance(entityId: string) {
    try {
      const data = await this.gateway.proxyRequest('regulatory', `/compliance/${entityId}`);
      this.monitor.logSuccess('regulatory-compliance');
      return data;
    } catch (error) {
      this.monitor.logFailure('regulatory-compliance', error.message);
      throw error;
    }
  }

  async getLatestRegulations() {
    try {
      const data = await this.gateway.proxyRequest('regulatory', '/regulations/latest');
      this.monitor.logSuccess('regulatory-list');
      return data;
    } catch (error) {
      this.monitor.logFailure('regulatory-list', error.message);
      throw error;
    }
  }
}
