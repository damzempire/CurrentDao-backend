import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GlobalEnergyController } from './global-energy.controller';
import { InternationalGridService } from './grid/international-grid.service';
import { CrossBorderFlowsService } from './flows/cross-border-flows.service';
import { MarketCoordinationService } from './coordination/market-coordination.service';
import { GlobalBalancingService } from './balancing/global-balancing.service';
import { InternationalComplianceService } from './compliance/international-compliance.service';
import { GlobalAnalyticsService } from './analytics/global-analytics.service';
import { DisasterRecoveryService } from './resilience/disaster-recovery.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
  ],
  controllers: [GlobalEnergyController],
  providers: [
    InternationalGridService,
    CrossBorderFlowsService,
    MarketCoordinationService,
    GlobalBalancingService,
    InternationalComplianceService,
    GlobalAnalyticsService,
    DisasterRecoveryService,
  ],
  exports: [
    InternationalGridService,
    CrossBorderFlowsService,
    MarketCoordinationService,
    GlobalBalancingService,
    InternationalComplianceService,
    GlobalAnalyticsService,
    DisasterRecoveryService,
  ],
})
export class GlobalEnergyModule {}
