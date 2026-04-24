import { Injectable } from '@nestjs/common';
import { GatewayService } from '../../gateway/gateway.service';
import { IntegrationMonitorService } from '../monitoring/integration-monitor.service';

@Injectable()
export class IotPlatformService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly monitor: IntegrationMonitorService,
  ) {}

  async getDeviceTelemetry(deviceId: string) {
    try {
      const data = await this.gateway.proxyRequest('iot', `/devices/${deviceId}/telemetry`);
      this.monitor.logSuccess(`iot-${deviceId}`);
      return data;
    } catch (error) {
      this.monitor.logFailure(`iot-${deviceId}`, error.message);
      throw error;
    }
  }

  async sendDeviceCommand(deviceId: string, command: any) {
    try {
      const data = await this.gateway.proxyRequest('iot', `/devices/${deviceId}/commands`, command);
      this.monitor.logSuccess(`iot-command-${deviceId}`);
      return data;
    } catch (error) {
      this.monitor.logFailure(`iot-command-${deviceId}`, error.message);
      throw error;
    }
  }
}
