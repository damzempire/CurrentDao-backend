import { Injectable } from '@nestjs/common';
import { EnergyProviderService } from './energy/energy-provider.service';
import { UtilityCompanyService } from './utility/utility-company.service';
import { WeatherServiceService } from './weather/weather-service.service';
import { IotPlatformService } from './iot/iot-platform.service';

@Injectable()
export class IntegrationService {
  constructor(
    private readonly energy: EnergyProviderService,
    private readonly utility: UtilityCompanyService,
    private readonly weather: WeatherServiceService,
    private readonly iot: IotPlatformService,
  ) {}

  async getConsolidatedData(location: string, userId: string, providerId: string, utilityId: string) {
    const [weather, grid, usage] = await Promise.all([
      this.weather.getCurrentWeather(location),
      this.energy.getGridStatus(providerId),
      this.utility.getConsumptionData(userId, utilityId),
    ]);

    return {
      timestamp: new Date(),
      location,
      weather,
      grid,
      usage,
    };
  }
}
