import { Injectable } from '@nestjs/common';
import { GatewayService } from '../../gateway/gateway.service';
import { IntegrationMonitorService } from '../monitoring/integration-monitor.service';

@Injectable()
export class WeatherServiceService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly monitor: IntegrationMonitorService,
  ) {}

  async getCurrentWeather(location: string) {
    try {
      const data = await this.gateway.proxyRequest('weather', `/current?q=${location}`);
      this.monitor.logSuccess('weather-current');
      return data;
    } catch (error) {
      this.monitor.logFailure('weather-current', error.message);
      throw error;
    }
  }

  async getForecast(location: string, days: number = 3) {
    try {
      const data = await this.gateway.proxyRequest('weather', `/forecast?q=${location}&days=${days}`);
      this.monitor.logSuccess('weather-forecast');
      return data;
    } catch (error) {
      this.monitor.logFailure('weather-forecast', error.message);
      throw error;
    }
  }
}
