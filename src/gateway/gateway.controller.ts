import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { GatewayService } from './gateway.service';

@Controller('gateway')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post('proxy/:alias/*')
  async proxyPost(
    @Param('alias') alias: string,
    @Param('0') path: string,
    @Body() body: any,
  ) {
    return this.gatewayService.proxyRequest(alias, `/${path}`, body);
  }

  @Get('proxy/:alias/*')
  async proxyGet(
    @Param('alias') alias: string,
    @Param('0') path: string,
    @Query() query: any,
  ) {
    const queryString = new URLSearchParams(query).toString();
    const endpoint = queryString ? `/${path}?${queryString}` : `/${path}`;
    return this.gatewayService.proxyRequest(alias, endpoint);
  }

  @Get('health')
  getHealth() {
    return this.gatewayService.getHealthStatus();
  }
}
