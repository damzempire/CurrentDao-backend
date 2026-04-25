import { Controller, Post, Get, Body, Param, Query, Header } from '@nestjs/common';
import { GraphqlService } from './graphql/graphql.service';
import { ApiAnalyticsService } from './analytics/api-analytics.service';
import { ApiDocsService } from './documentation/api-docs.service';
import { DeveloperPortalService } from './portal/developer-portal.service';

@Controller('api-gateway')
export class ApiGatewayController {
  constructor(
    private readonly graphql: GraphqlService,
    private readonly analytics: ApiAnalyticsService,
    private readonly docs: ApiDocsService,
    private readonly portal: DeveloperPortalService,
  ) {}

  @Post('graphql')
  async handleGraphql(@Body() body: { query: string; variables?: any }) {
    this.analytics.logRequest('/graphql');
    return this.graphql.executeQuery(body.query, body.variables);
  }

  @Get('docs')
  async getDocs() {
    return this.docs.generateOpenApiSpec();
  }

  @Get('analytics')
  async getAnalytics() {
    return this.analytics.getMetrics();
  }

  @Post('keys')
  async createKey(@Body() body: { owner: string; name: string }) {
    const key = this.portal.generateKey(body.owner, body.name);
    return { key };
  }
}
