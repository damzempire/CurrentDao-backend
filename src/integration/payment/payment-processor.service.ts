import { Injectable } from '@nestjs/common';
import { GatewayService } from '../../gateway/gateway.service';
import { IntegrationMonitorService } from '../monitoring/integration-monitor.service';

@Injectable()
export class PaymentProcessorService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly monitor: IntegrationMonitorService,
  ) {}

  async processTransaction(amount: number, currency: string, source: string) {
    try {
      const data = await this.gateway.proxyRequest('payment', '/transactions', { amount, currency, source });
      this.monitor.logSuccess('payment-transaction');
      return data;
    } catch (error) {
      this.monitor.logFailure('payment-transaction', error.message);
      throw error;
    }
  }
}
