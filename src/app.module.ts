import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatewayModule } from './gateway/gateway.module';
import { IntegrationModule } from './integration/integration.module';
import { SecurityModule } from './security/security.module';
import { ApiGatewayModule } from './api-gateway/api-gateway.module';

@Module({
  imports: [
    GatewayModule,
    IntegrationModule,
    SecurityModule,
    ApiGatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
