import { Module } from '@nestjs/common';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { EnergyProviderService } from './energy/energy-provider.service';
import { UtilityCompanyService } from './utility/utility-company.service';
import { WeatherServiceService } from './weather/weather-service.service';
import { IotPlatformService } from './iot/iot-platform.service';
import { PaymentProcessorService } from './payment/payment-processor.service';
import { RegulatoryServiceService } from './regulatory/regulatory-service.service';
import { IntegrationMonitorService } from './monitoring/integration-monitor.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  controllers: [IntegrationController],
  providers: [
    IntegrationService,
    EnergyProviderService,
    UtilityCompanyService,
    WeatherServiceService,
    IotPlatformService,
    PaymentProcessorService,
    RegulatoryServiceService,
    IntegrationMonitorService,
  ],
  exports: [IntegrationService],
})
export class IntegrationModule {}
