import { Injectable } from '@nestjs/common';
import { GatewayService } from '../../gateway/gateway.service';
import { IntegrationMonitorService } from '../monitoring/integration-monitor.service';

@Injectable()
export class UtilityCompanyService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly monitor: IntegrationMonitorService,
  ) {}

  async getConsumptionData(userId: string, utilityId: string) {
    try {
      const data = await this.gateway.proxyRequest('energy', `/utilities/${utilityId}/usage/${userId}`);
      this.monitor.logSuccess(`utility-${utilityId}`);
      return data;
    } catch (error) {
      this.monitor.logFailure(`utility-${utilityId}`, error.message);
      throw error;
    }
  }
}
