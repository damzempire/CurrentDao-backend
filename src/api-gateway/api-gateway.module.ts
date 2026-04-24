import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { GraphqlService } from './graphql/graphql.service';
import { ApiVersioningService } from './versioning/api-versioning.service';
import { ApiAnalyticsService } from './analytics/api-analytics.service';
import { DeveloperPortalService } from './portal/developer-portal.service';
import { ApiDocsService } from './documentation/api-docs.service';
import { ApiTestingService } from './testing/api-testing.service';
import { ApiSecurityService } from './security/api-security.service';

@Module({
  controllers: [ApiGatewayController],
  providers: [
    GraphqlService,
    ApiVersioningService,
    ApiAnalyticsService,
    DeveloperPortalService,
    ApiDocsService,
    ApiTestingService,
    ApiSecurityService,
  ],
  exports: [
    GraphqlService,
    DeveloperPortalService,
  ],
})
export class ApiGatewayModule {}
