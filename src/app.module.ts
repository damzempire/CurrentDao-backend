import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import databaseConfig from './config/database.config';
import stellarConfig from './config/stellar.config';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { AppService } from './app.service';
import { MarketForecastingModule } from './forecasting/market-forecasting.module';
import { RiskManagementModule } from './risk/risk-management.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, stellarConfig],
    }),

    }),
    SecurityModule,
    ApmModule,
    TracingModule,
    ShardingModule,
    MarketForecastingModule,
    RiskManagementModule,

  ],
})
export class AppModule { }
