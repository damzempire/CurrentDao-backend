import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { HealthController as ApiHealthController } from './api-health.controller';

@Module({
  imports: [],
  controllers: [AppController, HealthController, ApiHealthController],
  providers: [AppService],
})
export class AppModule {}
