import { Injectable } from '@nestjs/common';
import { GatewayService } from '../../gateway/gateway.service';
import { IntegrationMonitorService } from '../monitoring/integration-monitor.service';

@Injectable()
export class EnergyProviderService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly monitor: IntegrationMonitorService,
  ) {}

  async getGridStatus(providerId: string) {
    try {
      const data = await this.gateway.proxyRequest('energy', `/providers/${providerId}/status`);
      this.monitor.logSuccess(`energy-${providerId}`);
      return data;
    } catch (error) {
      this.monitor.logFailure(`energy-${providerId}`, error.message);
      throw error;
    }
  }

  async getPricing(providerId: string) {
    try {
      const data = await this.gateway.proxyRequest('energy', `/providers/${providerId}/pricing`);
      this.monitor.logSuccess(`energy-pricing-${providerId}`);
      return data;
    } catch (error) {
      this.monitor.logFailure(`energy-pricing-${providerId}`, error.message);
      throw error;
    }
  }
}
