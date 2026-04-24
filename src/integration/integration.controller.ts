import { Controller, Get, Query } from '@nestjs/common';
import { IntegrationService } from './integration.service';

@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('consolidated')
  async getConsolidated(
    @Query('location') location: string,
    @Query('userId') userId: string,
    @Query('providerId') providerId: string,
    @Query('utilityId') utilityId: string,
  ) {
    return this.integrationService.getConsolidatedData(location, userId, providerId, utilityId);
  }
}
