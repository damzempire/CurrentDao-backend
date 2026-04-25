import { Controller, Get, Post, Body, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InternationalGridService, EnergyGrid, GridMetrics } from './grid/international-grid.service';
import { CrossBorderFlowsService, EnergyFlow, FlowMetrics } from './flows/cross-border-flows.service';
import { MarketCoordinationService, EnergyMarket, MarketCoordinationMetrics } from './coordination/market-coordination.service';
import { GlobalBalancingService, BalancingArea, BalancingMetrics } from './balancing/global-balancing.service';
import { InternationalComplianceService, ComplianceRegulation, ComplianceMetrics } from './compliance/international-compliance.service';
import { GlobalAnalyticsService, GlobalEnergyMetrics, RegionalAnalytics } from './analytics/global-analytics.service';
import { DisasterRecoveryService, DisasterScenario, ResilienceMetrics } from './resilience/disaster-recovery.service';

@ApiTags('global-energy')
@Controller('global-energy')
export class GlobalEnergyController {
  constructor(
    private readonly gridService: InternationalGridService,
    private readonly flowsService: CrossBorderFlowsService,
    private readonly marketService: MarketCoordinationService,
    private readonly balancingService: GlobalBalancingService,
    private readonly complianceService: InternationalComplianceService,
    private readonly analyticsService: GlobalAnalyticsService,
    private readonly disasterService: DisasterRecoveryService,
  ) {}

  // Grid Management Endpoints
  @Get('grids')
  @ApiOperation({ summary: 'Get all international energy grids' })
  @ApiResponse({ status: 200, description: 'Grids retrieved successfully' })
  async getAllGrids(): Promise<EnergyGrid[]> {
    return this.gridService.getAllGrids();
  }

  @Get('grids/:id')
  @ApiOperation({ summary: 'Get grid by ID' })
  @ApiResponse({ status: 200, description: 'Grid retrieved successfully' })
  @ApiParam({ name: 'id', description: 'Grid ID' })
  async getGridById(@Param('id') id: string): Promise<EnergyGrid | null> {
    return this.gridService.getGridById(id);
  }

  @Get('grids/country/:countryCode')
  @ApiOperation({ summary: 'Get grids by country' })
  @ApiResponse({ status: 200, description: 'Grids retrieved successfully' })
  @ApiParam({ name: 'countryCode', description: 'Country code' })
  async getGridsByCountry(@Param('countryCode') countryCode: string): Promise<EnergyGrid[]> {
    return this.gridService.getGridsByCountry(countryCode);
  }

  @Get('grids/metrics')
  @ApiOperation({ summary: 'Get grid metrics' })
  @ApiResponse({ status: 200, description: 'Grid metrics retrieved successfully' })
  async getGridMetrics(): Promise<GridMetrics> {
    return this.gridService.getGridMetrics();
  }

  @Get('grids/topology')
  @ApiOperation({ summary: 'Get grid topology visualization' })
  @ApiResponse({ status: 200, description: 'Grid topology retrieved successfully' })
  async getGridTopology() {
    return this.gridService.getGridTopology();
  }

  // Cross-Border Flows Endpoints
  @Get('flows')
  @ApiOperation({ summary: 'Get all cross-border energy flows' })
  @ApiResponse({ status: 200, description: 'Flows retrieved successfully' })
  async getAllFlows(): Promise<EnergyFlow[]> {
    return this.flowsService.getAllFlows();
  }

  @Get('flows/country/:countryCode')
  @ApiOperation({ summary: 'Get flows by country' })
  @ApiResponse({ status: 200, description: 'Flows retrieved successfully' })
  @ApiParam({ name: 'countryCode', description: 'Country code' })
  async getFlowsByCountry(@Param('countryCode') countryCode: string): Promise<EnergyFlow[]> {
    return this.flowsService.getFlowsByCountry(countryCode);
  }

  @Get('flows/metrics')
  @ApiOperation({ summary: 'Get flow metrics' })
  @ApiResponse({ status: 200, description: 'Flow metrics retrieved successfully' })
  async getFlowMetrics(): Promise<FlowMetrics> {
    return this.flowsService.getFlowMetrics();
  }

  @Get('flows/forecast')
  @ApiOperation({ summary: 'Get flow forecast' })
  @ApiResponse({ status: 200, description: 'Flow forecast retrieved successfully' })
  @ApiQuery({ name: 'fromCountry', description: 'From country code' })
  @ApiQuery({ name: 'toCountry', description: 'To country code' })
  @ApiQuery({ name: 'timeframe', description: 'Timeframe', enum: ['hour', 'day', 'week', 'month'], required: false })
  async getFlowForecast(@Query() query: {
    fromCountry: string;
    toCountry: string;
    timeframe?: 'hour' | 'day' | 'week' | 'month';
  }) {
    return this.flowsService.generateFlowForecast(query.fromCountry, query.toCountry, query.timeframe);
  }

  @Post('flows/optimize')
  @ApiOperation({ summary: 'Optimize energy flows' })
  @ApiResponse({ status: 200, description: 'Flows optimized successfully' })
  async optimizeFlows() {
    return this.flowsService.optimizeFlows();
  }

  // Market Coordination Endpoints
  @Get('markets')
  @ApiOperation({ summary: 'Get all energy markets' })
  @ApiResponse({ status: 200, description: 'Markets retrieved successfully' })
  async getAllMarkets(): Promise<EnergyMarket[]> {
    return this.marketService.getAllMarkets();
  }

  @Get('markets/active')
  @ApiOperation({ summary: 'Get active markets' })
  @ApiResponse({ status: 200, description: 'Active markets retrieved successfully' })
  async getActiveMarkets(): Promise<EnergyMarket[]> {
    return this.marketService.getActiveMarkets();
  }

  @Get('markets/metrics')
  @ApiOperation({ summary: 'Get market coordination metrics' })
  @ApiResponse({ status: 200, description: 'Market metrics retrieved successfully' })
  async getMarketMetrics(): Promise<MarketCoordinationMetrics> {
    return this.marketService.getCoordinationMetrics();
  }

  @Post('markets/bids')
  @ApiOperation({ summary: 'Submit market bid' })
  @ApiResponse({ status: 201, description: 'Bid submitted successfully' })
  async submitBid(@Body() bidData: any) {
    return this.marketService.submitBid(bidData);
  }

  @Get('markets/integration')
  @ApiOperation({ summary: 'Get market integration status' })
  @ApiResponse({ status: 200, description: 'Integration status retrieved successfully' })
  async getMarketIntegrationStatus() {
    return this.marketService.getMarketIntegrationStatus();
  }

  @Post('markets/cross-border')
  @ApiOperation({ summary: 'Enable cross-border trading' })
  @ApiResponse({ status: 200, description: 'Cross-border trading enabled' })
  async enableCrossBorderTrading(@Body() body: {
    marketId1: string;
    marketId2: string;
    capacity: number;
  }) {
    return this.marketService.enableCrossBorderTrading(body.marketId1, body.marketId2, body.capacity);
  }

  // Balancing Services Endpoints
  @Get('balancing/areas')
  @ApiOperation({ summary: 'Get all balancing areas' })
  @ApiResponse({ status: 200, description: 'Balancing areas retrieved successfully' })
  async getAllBalancingAreas(): Promise<BalancingArea[]> {
    return this.balancingService.getAllBalancingAreas();
  }

  @Get('balancing/areas/critical')
  @ApiOperation({ summary: 'Get critical balancing areas' })
  @ApiResponse({ status: 200, description: 'Critical areas retrieved successfully' })
  async getCriticalBalancingAreas(): Promise<BalancingArea[]> {
    return this.balancingService.getCriticalBalancingAreas();
  }

  @Get('balancing/metrics')
  @ApiOperation({ summary: 'Get balancing metrics' })
  @ApiResponse({ status: 200, description: 'Balancing metrics retrieved successfully' })
  async getBalancingMetrics(): Promise<BalancingMetrics> {
    return this.balancingService.getBalancingMetrics();
  }

  @Get('balancing/reserves')
  @ApiOperation({ summary: 'Get balancing reserves' })
  @ApiResponse({ status: 200, description: 'Reserves retrieved successfully' })
  @ApiQuery({ name: 'areaId', description: 'Balancing area ID', required: false })
  async getReserves(@Query('areaId') areaId?: string) {
    if (areaId) {
      return this.balancingService.getReservesByArea(areaId);
    }
    return this.balancingService.getAllReserves();
  }

  @Post('balancing/reserves/:reserveId/activate')
  @ApiOperation({ summary: 'Activate balancing reserve' })
  @ApiResponse({ status: 200, description: 'Reserve activated successfully' })
  @ApiParam({ name: 'reserveId', description: 'Reserve ID' })
  async activateReserve(
    @Param('reserveId') reserveId: string,
    @Body() body: { volume: number }
  ) {
    return this.balancingService.activateReserve(reserveId, body.volume);
  }

  @Post('balancing/reserves/:reserveId/deactivate')
  @ApiOperation({ summary: 'Deactivate balancing reserve' })
  @ApiResponse({ status: 200, description: 'Reserve deactivated successfully' })
  @ApiParam({ name: 'reserveId', description: 'Reserve ID' })
  async deactivateReserve(@Param('reserveId') reserveId: string) {
    return this.balancingService.deactivateReserve(reserveId);
  }

  @Get('balancing/opportunities')
  @ApiOperation({ summary: 'Get cross-border balancing opportunities' })
  @ApiResponse({ status: 200, description: 'Opportunities retrieved successfully' })
  async getCrossBorderBalancingOpportunities() {
    return this.balancingService.getCrossBorderBalancingOpportunities();
  }

  // Compliance Endpoints
  @Get('compliance/regulations')
  @ApiOperation({ summary: 'Get all compliance regulations' })
  @ApiResponse({ status: 200, description: 'Regulations retrieved successfully' })
  async getAllRegulations(): Promise<ComplianceRegulation[]> {
    return this.complianceService.getAllRegulations();
  }

  @Get('compliance/regulations/active')
  @ApiOperation({ summary: 'Get active regulations' })
  @ApiResponse({ status: 200, description: 'Active regulations retrieved successfully' })
  async getActiveRegulations(): Promise<ComplianceRegulation[]> {
    return this.complianceService.getActiveRegulations();
  }

  @Get('compliance/checks')
  @ApiOperation({ summary: 'Get compliance checks' })
  @ApiResponse({ status: 200, description: 'Compliance checks retrieved successfully' })
  @ApiQuery({ name: 'entityId', description: 'Entity ID', required: false })
  async getComplianceChecks(@Query('entityId') entityId?: string) {
    if (entityId) {
      return this.complianceService.getChecksByEntity(entityId);
    }
    return this.complianceService.getAllChecks();
  }

  @Get('compliance/checks/non-compliant')
  @ApiOperation({ summary: 'Get non-compliant checks' })
  @ApiResponse({ status: 200, description: 'Non-compliant checks retrieved successfully' })
  async getNonCompliantChecks() {
    return this.complianceService.getNonCompliantChecks();
  }

  @Get('compliance/metrics')
  @ApiOperation({ summary: 'Get compliance metrics' })
  @ApiResponse({ status: 200, description: 'Compliance metrics retrieved successfully' })
  async getComplianceMetrics(): Promise<ComplianceMetrics> {
    return this.complianceService.getComplianceMetrics();
  }

  @Get('compliance/alerts')
  @ApiOperation({ summary: 'Get compliance alerts' })
  @ApiResponse({ status: 200, description: 'Compliance alerts retrieved successfully' })
  @ApiQuery({ name: 'severity', description: 'Alert severity', required: false })
  async getComplianceAlerts(@Query('severity') severity?: string) {
    return this.complianceService.getActiveAlerts(severity);
  }

  @Post('compliance/checks')
  @ApiOperation({ summary: 'Perform manual compliance check' })
  @ApiResponse({ status: 201, description: 'Check initiated successfully' })
  async performManualCheck(@Body() checkData: any) {
    return this.complianceService.performManualCheck(checkData);
  }

  @Get('compliance/status/:entityId')
  @ApiOperation({ summary: 'Get compliance status for entity' })
  @ApiResponse({ status: 200, description: 'Compliance status retrieved successfully' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  async getComplianceStatus(@Param('entityId') entityId: string) {
    return this.complianceService.getComplianceStatus(entityId);
  }

  // Analytics Endpoints
  @Get('analytics/global')
  @ApiOperation({ summary: 'Get global energy metrics' })
  @ApiResponse({ status: 200, description: 'Global metrics retrieved successfully' })
  async getGlobalMetrics(): Promise<GlobalEnergyMetrics> {
    return this.analyticsService.getGlobalMetrics();
  }

  @Get('analytics/regional')
  @ApiOperation({ summary: 'Get regional analytics' })
  @ApiResponse({ status: 200, description: 'Regional analytics retrieved successfully' })
  async getRegionalAnalytics(): Promise<RegionalAnalytics[]> {
    return this.analyticsService.getRegionalAnalytics();
  }

  @Get('analytics/flows')
  @ApiOperation({ summary: 'Analyze energy flows' })
  @ApiResponse({ status: 200, description: 'Flow analysis completed successfully' })
  async analyzeEnergyFlows() {
    return this.analyticsService.analyzeEnergyFlows();
  }

  @Get('analytics/markets')
  @ApiOperation({ summary: 'Analyze markets' })
  @ApiResponse({ status: 200, description: 'Market analysis completed successfully' })
  async analyzeMarkets() {
    return this.analyticsService.analyzeMarkets();
  }

  @Get('analytics/sustainability')
  @ApiOperation({ summary: 'Get sustainability metrics' })
  @ApiResponse({ status: 200, description: 'Sustainability metrics retrieved successfully' })
  async getSustainabilityMetrics() {
    return this.analyticsService.getSustainabilityMetrics();
  }

  @Get('analytics/risk')
  @ApiOperation({ summary: 'Perform risk analysis' })
  @ApiResponse({ status: 200, description: 'Risk analysis completed successfully' })
  async performRiskAnalysis() {
    return this.analyticsService.performRiskAnalysis();
  }

  @Get('analytics/optimization')
  @ApiOperation({ summary: 'Get optimization recommendations' })
  @ApiResponse({ status: 200, description: 'Optimization recommendations retrieved successfully' })
  async getOptimizationRecommendations() {
    return this.analyticsService.generateOptimizationRecommendations();
  }

  @Get('analytics/demand-prediction')
  @ApiOperation({ summary: 'Predict energy demand' })
  @ApiResponse({ status: 200, description: 'Demand prediction completed successfully' })
  @ApiQuery({ name: 'timeframe', description: 'Timeframe', enum: ['day', 'week', 'month', 'year'], required: false })
  @ApiQuery({ name: 'region', description: 'Region', required: false })
  async predictEnergyDemand(@Query() query: {
    timeframe?: 'day' | 'week' | 'month' | 'year';
    region?: string;
  }) {
    return this.analyticsService.predictEnergyDemand(query.timeframe, query.region);
  }

  // Disaster Recovery Endpoints
  @Get('disaster/scenarios')
  @ApiOperation({ summary: 'Get all disaster scenarios' })
  @ApiResponse({ status: 200, description: 'Scenarios retrieved successfully' })
  async getAllScenarios(): Promise<DisasterScenario[]> {
    return this.disasterService.getAllScenarios();
  }

  @Get('disaster/scenarios/active')
  @ApiOperation({ summary: 'Get active disaster scenarios' })
  @ApiResponse({ status: 200, description: 'Active scenarios retrieved successfully' })
  async getActiveScenarios(): Promise<DisasterScenario[]> {
    return this.disasterService.getActiveScenarios();
  }

  @Get('disaster/responses')
  @ApiOperation({ summary: 'Get disaster responses' })
  @ApiResponse({ status: 200, description: 'Responses retrieved successfully' })
  async getAllResponses() {
    return this.disasterService.getAllResponses();
  }

  @Get('disaster/responses/active')
  @ApiOperation({ summary: 'Get active disaster responses' })
  @ApiResponse({ status: 200, description: 'Active responses retrieved successfully' })
  async getActiveResponses() {
    return this.disasterService.getActiveResponses();
  }

  @Post('disaster/scenarios/:scenarioId/activate')
  @ApiOperation({ summary: 'Activate disaster scenario' })
  @ApiResponse({ status: 200, description: 'Scenario activated successfully' })
  @ApiParam({ name: 'scenarioId', description: 'Scenario ID' })
  async activateScenario(@Param('scenarioId') scenarioId: string) {
    return this.disasterService.activateScenario(scenarioId);
  }

  @Get('disaster/resilience')
  @ApiOperation({ summary: 'Get resilience metrics' })
  @ApiResponse({ status: 200, description: 'Resilience metrics retrieved successfully' })
  async getResilienceMetrics(): Promise<ResilienceMetrics> {
    return this.disasterService.getResilienceMetrics();
  }

  @Post('disaster/drills')
  @ApiOperation({ summary: 'Run disaster recovery drill' })
  @ApiResponse({ status: 201, description: 'Drill initiated successfully' })
  async runDrill(@Body() body: { scenarioId: string }) {
    return this.disasterService.runDrill(body.scenarioId);
  }

  @Get('disaster/reports')
  @ApiOperation({ summary: 'Generate recovery report' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiQuery({ name: 'timeframe', description: 'Timeframe', enum: ['week', 'month', 'quarter', 'year'], required: false })
  async generateRecoveryReport(@Query('timeframe') timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    return this.disasterService.generateRecoveryReport(timeframe);
  }

  // Comprehensive Dashboard Endpoints
  @Get('dashboard/overview')
  @ApiOperation({ summary: 'Get comprehensive global energy overview' })
  @ApiResponse({ status: 200, description: 'Overview retrieved successfully' })
  async getOverview() {
    const [globalMetrics, gridMetrics, flowMetrics, marketMetrics, balancingMetrics, complianceMetrics, resilienceMetrics] = await Promise.all([
      this.analyticsService.getGlobalMetrics(),
      this.gridService.getGridMetrics(),
      this.flowsService.getFlowMetrics(),
      this.marketService.getCoordinationMetrics(),
      this.balancingService.getBalancingMetrics(),
      this.complianceService.getComplianceMetrics(),
      this.disasterService.getResilienceMetrics(),
    ]);

    return {
      timestamp: new Date(),
      global: globalMetrics,
      grids: gridMetrics,
      flows: flowMetrics,
      markets: marketMetrics,
      balancing: balancingMetrics,
      compliance: complianceMetrics,
      resilience: resilienceMetrics,
    };
  }

  @Get('dashboard/alerts')
  @ApiOperation({ summary: 'Get all system alerts' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  async getSystemAlerts() {
    const [gridAlerts, complianceAlerts] = await Promise.all([
      this.gridService.getActiveAlerts(),
      this.complianceService.getActiveAlerts(),
    ]);

    return {
      grid: gridAlerts,
      compliance: complianceAlerts,
      total: gridAlerts.length + complianceAlerts.length,
    };
  }

  @Get('dashboard/kpi')
  @ApiOperation({ summary: 'Get key performance indicators' })
  @ApiResponse({ status: 200, description: 'KPIs retrieved successfully' })
  async getKPIs() {
    const [globalMetrics, regionalAnalytics, sustainabilityMetrics] = await Promise.all([
      this.analyticsService.getGlobalMetrics(),
      this.analyticsService.getRegionalAnalytics(),
      this.analyticsService.getSustainabilityMetrics(),
    ]);

    return {
      efficiency: {
        gridStability: globalMetrics.gridStability,
        systemEfficiency: globalMetrics.systemEfficiency,
        crossBorderIntegration: globalMetrics.crossBorderIntegration,
      },
      sustainability: {
        renewableShare: globalMetrics.renewableShare,
        carbonIntensity: globalMetrics.carbonIntensity,
        globalRenewableGeneration: sustainabilityMetrics.globalMetrics.totalRenewableGeneration,
      },
      performance: {
        totalCapacity: globalMetrics.totalGrids,
        activeFlows: globalMetrics.activeFlows,
        marketParticipants: globalMetrics.marketParticipants,
      },
      regional: regionalAnalytics.map(region => ({
        region: region.region,
        countryCode: region.countryCode,
        demand: region.metrics.energyDemand,
        supply: region.metrics.supply,
        price: region.metrics.price,
      })),
    };
  }
}
