import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { ExternalApiService } from './integration/external-api.service';
import { ApiRouterService } from './routing/api-router.service';
import { ExternalAuthService } from './security/external-auth.service';
import { HealthMonitorService } from './monitoring/health-monitor.service';
import { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service';

@Module({
  controllers: [GatewayController],
  providers: [
    GatewayService,
    ExternalApiService,
    ApiRouterService,
    ExternalAuthService,
    HealthMonitorService,
    CircuitBreakerService,
  ],
  exports: [GatewayService],
})
export class GatewayModule {}
