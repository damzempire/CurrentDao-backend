import { Controller, Get, Post, Body, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { IpGeolocationService, GeolocationResult } from './geolocation/ip-geolocation.service';
import { LocationRulesService, TradingRuleResult } from './rules/location-rules.service';
import { GeographicAnalyticsService, GeographicMetrics, CountryAnalytics, GeographicInsight, HeatmapData } from './analytics/geographic-analytics.service';
import { LocationVerificationService, LocationVerificationRequest, VerificationResult } from './validation/location-verification.service';
import { MappingService, MapVisualization, RouteData } from './integration/mapping-service';

@ApiTags('location')
@Controller('location')
export class LocationController {
  constructor(
    private readonly geolocationService: IpGeolocationService,
    private readonly rulesService: LocationRulesService,
    private readonly analyticsService: GeographicAnalyticsService,
    private readonly verificationService: LocationVerificationService,
    private readonly mappingService: MappingService,
  ) {}

  @Get('geolocation/:ip')
  @ApiOperation({ summary: 'Get geolocation data for an IP address' })
  @ApiResponse({ status: 200, description: 'Geolocation data retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid IP address' })
  @ApiParam({ name: 'ip', description: 'IP address to geolocate' })
  async getGeolocation(@Param('ip') ip: string): Promise<GeolocationResult> {
    return this.geolocationService.getLocationByIp(ip);
  }

  @Get('geolocation/coordinates')
  @ApiOperation({ summary: 'Get location data from coordinates' })
  @ApiResponse({ status: 200, description: 'Location data retrieved successfully' })
  @ApiQuery({ name: 'lat', description: 'Latitude' })
  @ApiQuery({ name: 'lon', description: 'Longitude' })
  async getLocationByCoordinates(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
  ): Promise<GeolocationResult> {
    return this.geolocationService.getLocationByCoordinates(lat, lon);
  }

  @Post('rules/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Evaluate trading rules for a location' })
  @ApiResponse({ status: 200, description: 'Trading rules evaluated successfully' })
  async evaluateTradingRules(@Body() body: {
    location: any;
    userId?: string;
    transactionAmount?: number;
  }): Promise<TradingRuleResult> {
    return this.rulesService.evaluateTradingRules(
      body.location,
      body.userId,
      body.transactionAmount,
    );
  }

  @Get('rules/pricing/:countryCode')
  @ApiOperation({ summary: 'Get regional pricing for a country' })
  @ApiResponse({ status: 200, description: 'Regional pricing retrieved successfully' })
  @ApiParam({ name: 'countryCode', description: 'ISO country code' })
  async getRegionalPricing(@Param('countryCode') countryCode: string) {
    const location = { ip: '', countryCode, country: '', city: '', region: '', latitude: 0, longitude: 0, timezone: '', isp: '', accuracy: 0 };
    return this.rulesService.getRegionalPricing(location);
  }

  @Get('rules/restrictions/:countryCode')
  @ApiOperation({ summary: 'Get location restrictions for a country' })
  @ApiResponse({ status: 200, description: 'Location restrictions retrieved successfully' })
  @ApiParam({ name: 'countryCode', description: 'ISO country code' })
  async getLocationRestrictions(@Param('countryCode') countryCode: string) {
    const location = { ip: '', countryCode, country: '', city: '', region: '', latitude: 0, longitude: 0, timezone: '', isp: '', accuracy: 0 };
    return this.rulesService.getLocationRestrictions(location);
  }

  @Get('analytics/metrics')
  @ApiOperation({ summary: 'Get geographic metrics' })
  @ApiResponse({ status: 200, description: 'Geographic metrics retrieved successfully' })
  @ApiQuery({ name: 'timeRange', description: 'Time range for metrics', enum: ['hour', 'day', 'week', 'month'], required: false })
  async getGeographicMetrics(@Query('timeRange') timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<GeographicMetrics> {
    return this.analyticsService.getGeographicMetrics(timeRange);
  }

  @Get('analytics/country/:countryCode')
  @ApiOperation({ summary: 'Get country-specific analytics' })
  @ApiResponse({ status: 200, description: 'Country analytics retrieved successfully' })
  @ApiParam({ name: 'countryCode', description: 'ISO country code' })
  async getCountryAnalytics(@Param('countryCode') countryCode: string): Promise<CountryAnalytics | null> {
    return this.analyticsService.getCountryAnalytics(countryCode);
  }

  @Get('analytics/insights')
  @ApiOperation({ summary: 'Get geographic insights' })
  @ApiResponse({ status: 200, description: 'Geographic insights retrieved successfully' })
  async getGeographicInsights(@Query() query: { country?: string; city?: string }): Promise<GeographicInsight[]> {
    const location = query.country ? {
      ip: '',
      country: query.country,
      countryCode: query.country,
      city: query.city || '',
      region: '',
      latitude: 0,
      longitude: 0,
      timezone: '',
      isp: '',
      accuracy: 0,
    } : undefined;
    
    return this.analyticsService.generateGeographicInsights(location);
  }

  @Get('analytics/heatmap')
  @ApiOperation({ summary: 'Get heatmap data' })
  @ApiResponse({ status: 200, description: 'Heatmap data retrieved successfully' })
  @ApiQuery({ name: 'type', description: 'Type of heatmap data', enum: ['users', 'revenue', 'activity'], required: false })
  async getHeatmapData(@Query('type') type: 'users' | 'revenue' | 'activity' = 'users'): Promise<HeatmapData[]> {
    return this.analyticsService.generateHeatmapData(type);
  }

  @Get('analytics/accuracy')
  @ApiOperation({ summary: 'Get location accuracy metrics' })
  @ApiResponse({ status: 200, description: 'Accuracy metrics retrieved successfully' })
  async getLocationAccuracyMetrics() {
    return this.analyticsService.getLocationAccuracyMetrics();
  }

  @Get('analytics/compliance')
  @ApiOperation({ summary: 'Get compliance metrics' })
  @ApiResponse({ status: 200, description: 'Compliance metrics retrieved successfully' })
  async getComplianceMetrics() {
    return this.analyticsService.getComplianceMetrics();
  }

  @Post('verification/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user location' })
  @ApiResponse({ status: 200, description: 'Location verification completed' })
  async verifyLocation(@Body() request: LocationVerificationRequest): Promise<VerificationResult> {
    return this.verificationService.verifyLocation(request);
  }

  @Get('verification/history/:userId')
  @ApiOperation({ summary: 'Get verification history for a user' })
  @ApiResponse({ status: 200, description: 'Verification history retrieved successfully' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', description: 'Number of records to retrieve', required: false })
  async getVerificationHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ): Promise<VerificationResult[]> {
    return this.verificationService.getVerificationHistory(userId, limit);
  }

  @Get('verification/methods')
  @ApiOperation({ summary: 'Get available verification methods' })
  @ApiResponse({ status: 200, description: 'Verification methods retrieved successfully' })
  async getVerificationMethods() {
    return this.verificationService.getVerificationMethods();
  }

  @Get('verification/statistics')
  @ApiOperation({ summary: 'Get verification statistics' })
  @ApiResponse({ status: 200, description: 'Verification statistics retrieved successfully' })
  async getVerificationStatistics() {
    return this.verificationService.getVerificationStatistics();
  }

  @Post('mapping/visualization')
  @ApiOperation({ summary: 'Generate map visualization' })
  @ApiResponse({ status: 200, description: 'Map visualization generated successfully' })
  async generateMapVisualization(@Body() body: {
    data: any[];
    type?: 'users' | 'transactions' | 'analytics' | 'compliance';
  }): Promise<MapVisualization> {
    return this.mappingService.generateMapVisualization(body.data, body.type);
  }

  @Post('mapping/route')
  @ApiOperation({ summary: 'Calculate route between two points' })
  @ApiResponse({ status: 200, description: 'Route calculated successfully' })
  async calculateRoute(@Body() body: {
    startPoint: { latitude: number; longitude: number };
    endPoint: { latitude: number; longitude: number };
    mode?: 'driving' | 'walking' | 'cycling' | 'transit';
  }): Promise<RouteData> {
    return this.mappingService.calculateRoute(body.startPoint, body.endPoint, body.mode);
  }

  @Post('mapping/geocode')
  @ApiOperation({ summary: 'Geocode an address' })
  @ApiResponse({ status: 200, description: 'Address geocoded successfully' })
  async geocodeAddress(@Body() body: { address: string }) {
    return this.mappingService.geocodeAddress(body.address);
  }

  @Get('mapping/reverse-geocode')
  @ApiOperation({ summary: 'Reverse geocode coordinates' })
  @ApiResponse({ status: 200, description: 'Coordinates reverse geocoded successfully' })
  @ApiQuery({ name: 'lat', description: 'Latitude' })
  @ApiQuery({ name: 'lon', description: 'Longitude' })
  async reverseGeocode(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
  ) {
    return this.mappingService.reverseGeocode(lat, lon);
  }

  @Get('mapping/boundaries')
  @ApiOperation({ summary: 'Get geographic boundaries' })
  @ApiResponse({ status: 200, description: 'Geographic boundaries retrieved successfully' })
  @ApiQuery({ name: 'type', description: 'Type of boundary', enum: ['country', 'state', 'city'] })
  @ApiQuery({ name: 'countryCode', description: 'Country code filter', required: false })
  async getGeographicBoundaries(@Query() query: {
    type: 'country' | 'state' | 'city';
    countryCode?: string;
  }) {
    return this.mappingService.getGeographicBoundaries(query.type, query.countryCode);
  }

  @Get('mapping/styles')
  @ApiOperation({ summary: 'Get available map styles' })
  @ApiResponse({ status: 200, description: 'Map styles retrieved successfully' })
  async getMapStyles() {
    return this.mappingService.getAvailableMapStyles();
  }

  @Get('mapping/tile')
  @ApiOperation({ summary: 'Get map tile URL' })
  @ApiResponse({ status: 200, description: 'Tile URL generated successfully' })
  @ApiQuery({ name: 'x', description: 'Tile X coordinate' })
  @ApiQuery({ name: 'y', description: 'Tile Y coordinate' })
  @ApiQuery({ name: 'z', description: 'Tile zoom level' })
  @ApiQuery({ name: 'style', description: 'Map style', required: false })
  async getMapTileUrl(@Query() query: {
    x: number;
    y: number;
    z: number;
    style?: string;
  }) {
    return this.mappingService.getMapTileUrl(query.x, query.y, query.z, query.style);
  }
}
