import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EnergyFlow {
  id: string;
  fromGridId: string;
  toGridId: string;
  fromCountry: string;
  toCountry: string;
  energyType: 'electricity' | 'natural_gas' | 'oil' | 'renewable' | 'hydrogen';
  volume: number; // MWh or equivalent
  price: number; // USD per MWh
  currency: string;
  direction: 'export' | 'import' | 'bidirectional';
  timestamp: Date;
  duration: number; // hours
  transmissionLoss: number; // percentage
  carbonIntensity: number; // kg CO2 per MWh
  status: 'active' | 'scheduled' | 'completed' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  contractId?: string;
}

export interface FlowOptimization {
  originalFlow: EnergyFlow;
  optimizedFlow: EnergyFlow;
  savings: number;
  lossReduction: number;
  carbonReduction: number;
  recommendations: string[];
}

export interface FlowMetrics {
  totalFlows: number;
  activeFlows: number;
  totalVolume: number;
  totalValue: number;
  averagePrice: number;
  totalLosses: number;
  averageEfficiency: number;
  carbonEmissions: number;
  renewableShare: number;
}

export interface FlowForecast {
  timeframe: 'hour' | 'day' | 'week' | 'month';
  predictions: Array<{
    timestamp: Date;
    fromCountry: string;
    toCountry: string;
    expectedVolume: number;
    expectedPrice: number;
    confidence: number;
    factors: string[];
  }>;
}

export interface TransmissionCorridor {
  id: string;
  name: string;
  fromCountry: string;
  toCountry: string;
  type: 'overhead' | 'submarine' | 'underground' | 'pipeline';
  capacity: number;
  utilization: number;
  efficiency: number;
  age: number; // years
  maintenanceDue: Date;
  expansionPlans: Array<{
    capacity: number;
    completionDate: Date;
    cost: number;
  }>;
}

@Injectable()
export class CrossBorderFlowsService {
  private readonly logger = new Logger(CrossBorderFlowsService.name);
  private flows: Map<string, EnergyFlow> = new Map();
  private corridors: Map<string, TransmissionCorridor> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeFlows();
    this.initializeCorridors();
    this.startFlowMonitoring();
  }

  private initializeFlows(): void {
    const sampleFlows: EnergyFlow[] = [
      {
        id: 'flow_us_ca_001',
        fromGridId: 'US_NERC',
        toGridId: 'CA_IESO',
        fromCountry: 'US',
        toCountry: 'CA',
        energyType: 'electricity',
        volume: 3200,
        price: 45.50,
        currency: 'USD',
        direction: 'export',
        timestamp: new Date(),
        duration: 1,
        transmissionLoss: 5.2,
        carbonIntensity: 0.4,
        status: 'active',
        priority: 'high',
        contractId: 'contract_us_ca_2024',
      },
      {
        id: 'flow_eu_gb_001',
        fromGridId: 'EU_ENTSOE',
        toGridId: 'GB_NATIONAL_GRID',
        fromCountry: 'FR',
        toCountry: 'GB',
        energyType: 'electricity',
        volume: 1500,
        price: 52.30,
        currency: 'EUR',
        direction: 'import',
        timestamp: new Date(),
        duration: 1,
        transmissionLoss: 3.8,
        carbonIntensity: 0.12,
        status: 'active',
        priority: 'medium',
      },
      {
        id: 'flow_cn_in_001',
        fromGridId: 'CN_STATE_GRID',
        toGridId: 'IN_PGCIL',
        fromCountry: 'CN',
        toCountry: 'IN',
        energyType: 'hydrogen',
        volume: 500,
        price: 3.20,
        currency: 'USD',
        direction: 'export',
        timestamp: new Date(),
        duration: 24,
        transmissionLoss: 8.5,
        carbonIntensity: 0.05,
        status: 'scheduled',
        priority: 'high',
      },
      {
        id: 'flow_jp_kr_001',
        fromGridId: 'JP_TEPCO',
        toGridId: 'KR_KEPCO',
        fromCountry: 'JP',
        toCountry: 'KR',
        energyType: 'natural_gas',
        volume: 800,
        price: 12.75,
        currency: 'USD',
        direction: 'bidirectional',
        timestamp: new Date(),
        duration: 6,
        transmissionLoss: 2.1,
        carbonIntensity: 0.45,
        status: 'active',
        priority: 'medium',
      },
      {
        id: 'flow_au_nz_001',
        fromGridId: 'AU_NEM',
        toGridId: 'NZ_Transpower',
        fromCountry: 'AU',
        toCountry: 'NZ',
        energyType: 'renewable',
        volume: 200,
        price: 38.90,
        currency: 'AUD',
        direction: 'export',
        timestamp: new Date(),
        duration: 2,
        transmissionLoss: 6.7,
        carbonIntensity: 0.02,
        status: 'active',
        priority: 'low',
      },
    ];

    sampleFlows.forEach(flow => {
      this.flows.set(flow.id, flow);
    });

    this.logger.log(`Initialized ${sampleFlows.length} cross-border energy flows`);
  }

  private initializeCorridors(): void {
    const sampleCorridors: TransmissionCorridor[] = [
      {
        id: 'corridor_us_ca',
        name: 'US-Canada Pacific Intertie',
        fromCountry: 'US',
        toCountry: 'CA',
        type: 'overhead',
        capacity: 5000,
        utilization: 64.0,
        efficiency: 94.8,
        age: 45,
        maintenanceDue: new Date('2024-06-15'),
        expansionPlans: [
          {
            capacity: 2000,
            completionDate: new Date('2026-12-31'),
            cost: 2500000000,
          },
        ],
      },
      {
        id: 'corridor_eu_gb',
        name: 'BritNed Interconnector',
        fromCountry: 'NL',
        toCountry: 'GB',
        type: 'submarine',
        capacity: 2000,
        utilization: 75.0,
        efficiency: 96.2,
        age: 12,
        maintenanceDue: new Date('2024-09-01'),
        expansionPlans: [],
      },
      {
        id: 'corridor_cn_in',
        name: 'China-India Energy Corridor',
        fromCountry: 'CN',
        toCountry: 'IN',
        type: 'overhead',
        capacity: 3000,
        utilization: 70.0,
        efficiency: 91.5,
        age: 8,
        maintenanceDue: new Date('2024-11-20'),
        expansionPlans: [
          {
            capacity: 1500,
            completionDate: new Date('2025-06-30'),
            cost: 1800000000,
          },
        ],
      },
    ];

    sampleCorridors.forEach(corridor => {
      this.corridors.set(corridor.id, corridor);
    });

    this.logger.log(`Initialized ${sampleCorridors.length} transmission corridors`);
  }

  private startFlowMonitoring(): void {
    setInterval(() => {
      this.updateFlowMetrics();
      this.optimizeActiveFlows();
    }, 60000); // Every minute

    this.logger.log('Started cross-border flow monitoring');
  }

  private updateFlowMetrics(): void {
    this.flows.forEach(flow => {
      if (flow.status === 'active') {
        // Simulate real-time volume variations
        const volumeVariation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
        flow.volume = Math.max(0, flow.volume * (1 + volumeVariation));
        
        // Simulate price variations
        const priceVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
        flow.price = Math.max(0, flow.price * (1 + priceVariation));
        
        // Update timestamp
        flow.timestamp = new Date();
      }
    });
  }

  private optimizeActiveFlows(): void {
    const activeFlows = Array.from(this.flows.values())
      .filter(flow => flow.status === 'active');

    activeFlows.forEach(flow => {
      // Check if flow can be optimized
      const efficiency = 100 - flow.transmissionLoss;
      const utilization = flow.volume / this.getCorridorCapacity(flow.fromCountry, flow.toCountry);
      
      if (efficiency < 90 || utilization > 0.9) {
        this.logger.log(`Flow ${flow.id} identified for optimization`);
      }
    });
  }

  private getCorridorCapacity(fromCountry: string, toCountry: string): number {
    const corridor = Array.from(this.corridors.values()).find(c => 
      (c.fromCountry === fromCountry && c.toCountry === toCountry) ||
      (c.fromCountry === toCountry && c.toCountry === fromCountry)
    );
    return corridor ? corridor.capacity : 1000; // Default capacity
  }

  async getAllFlows(): Promise<EnergyFlow[]> {
    return Array.from(this.flows.values());
  }

  async getFlowById(flowId: string): Promise<EnergyFlow | null> {
    return this.flows.get(flowId) || null;
  }

  async getFlowsByCountry(countryCode: string): Promise<EnergyFlow[]> {
    return Array.from(this.flows.values()).filter(flow => 
      flow.fromCountry === countryCode || flow.toCountry === countryCode
    );
  }

  async getFlowsByEnergyType(energyType: string): Promise<EnergyFlow[]> {
    return Array.from(this.flows.values()).filter(flow => 
      flow.energyType === energyType
    );
  }

  async getActiveFlows(): Promise<EnergyFlow[]> {
    return Array.from(this.flows.values()).filter(flow => 
      flow.status === 'active'
    );
  }

  async createFlow(flowData: Partial<EnergyFlow>): Promise<EnergyFlow> {
    const flow: EnergyFlow = {
      id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromGridId: flowData.fromGridId || '',
      toGridId: flowData.toGridId || '',
      fromCountry: flowData.fromCountry || '',
      toCountry: flowData.toCountry || '',
      energyType: flowData.energyType || 'electricity',
      volume: flowData.volume || 0,
      price: flowData.price || 0,
      currency: flowData.currency || 'USD',
      direction: flowData.direction || 'export',
      timestamp: new Date(),
      duration: flowData.duration || 1,
      transmissionLoss: flowData.transmissionLoss || 5.0,
      carbonIntensity: flowData.carbonIntensity || 0.5,
      status: flowData.status || 'scheduled',
      priority: flowData.priority || 'medium',
      contractId: flowData.contractId,
      ...flowData,
    };

    this.flows.set(flow.id, flow);
    this.logger.log(`Created new energy flow: ${flow.id}`);
    return flow;
  }

  async updateFlow(flowId: string, updateData: Partial<EnergyFlow>): Promise<boolean> {
    const flow = this.flows.get(flowId);
    if (!flow) {
      return false;
    }

    Object.assign(flow, updateData, { timestamp: new Date() });
    this.flows.set(flowId, flow);
    this.logger.log(`Updated energy flow: ${flowId}`);
    return true;
  }

  async cancelFlow(flowId: string, reason?: string): Promise<boolean> {
    const flow = this.flows.get(flowId);
    if (!flow) {
      return false;
    }

    flow.status = 'cancelled';
    this.logger.log(`Cancelled energy flow: ${flowId}${reason ? ` - ${reason}` : ''}`);
    return true;
  }

  async getFlowMetrics(): Promise<FlowMetrics> {
    const flows = Array.from(this.flows.values());
    const activeFlows = flows.filter(flow => flow.status === 'active');

    return {
      totalFlows: flows.length,
      activeFlows: activeFlows.length,
      totalVolume: flows.reduce((sum, flow) => sum + flow.volume, 0),
      totalValue: flows.reduce((sum, flow) => sum + (flow.volume * flow.price), 0),
      averagePrice: activeFlows.length > 0 
        ? activeFlows.reduce((sum, flow) => sum + flow.price, 0) / activeFlows.length 
        : 0,
      totalLosses: flows.reduce((sum, flow) => sum + (flow.volume * flow.transmissionLoss / 100), 0),
      averageEfficiency: activeFlows.length > 0 
        ? activeFlows.reduce((sum, flow) => sum + (100 - flow.transmissionLoss), 0) / activeFlows.length 
        : 0,
      carbonEmissions: flows.reduce((sum, flow) => sum + (flow.volume * flow.carbonIntensity), 0),
      renewableShare: this.calculateRenewableShare(flows),
    };
  }

  private calculateRenewableShare(flows: EnergyFlow[]): number {
    const totalVolume = flows.reduce((sum, flow) => sum + flow.volume, 0);
    if (totalVolume === 0) return 0;

    const renewableVolume = flows
      .filter(flow => flow.energyType === 'renewable' || flow.energyType === 'hydrogen')
      .reduce((sum, flow) => sum + flow.volume, 0);

    return renewableVolume / totalVolume;
  }

  async optimizeFlows(): Promise<FlowOptimization[]> {
    const optimizations: FlowOptimization[] = [];
    const activeFlows = Array.from(this.flows.values())
      .filter(flow => flow.status === 'active');

    activeFlows.forEach(flow => {
      const optimization = this.optimizeFlow(flow);
      if (optimization) {
        optimizations.push(optimization);
      }
    });

    return optimizations;
  }

  private optimizeFlow(flow: EnergyFlow): FlowOptimization | null {
    const recommendations: string[] = [];
    let optimizedFlow = { ...flow };
    let savings = 0;
    let lossReduction = 0;
    let carbonReduction = 0;

    // Optimize transmission loss
    if (flow.transmissionLoss > 8.0) {
      optimizedFlow.transmissionLoss = 6.5;
      lossReduction = (flow.transmissionLoss - optimizedFlow.transmissionLoss) * flow.volume / 100;
      savings = lossReduction * flow.price * 0.5; // 50% of loss value
      recommendations.push('Reduce transmission losses through voltage optimization');
    }

    // Optimize volume based on market conditions
    const marketPrice = this.getMarketPrice(flow.fromCountry, flow.toCountry);
    if (flow.price > marketPrice * 1.1) {
      const volumeReduction = flow.volume * 0.1;
      optimizedFlow.volume = flow.volume - volumeReduction;
      savings = volumeReduction * (flow.price - marketPrice);
      recommendations.push('Reduce volume due to unfavorable market conditions');
    }

    // Optimize carbon intensity
    if (flow.carbonIntensity > 0.3 && flow.energyType !== 'renewable') {
      optimizedFlow.carbonIntensity = 0.25;
      carbonReduction = (flow.carbonIntensity - optimizedFlow.carbonIntensity) * flow.volume;
      recommendations.push('Switch to lower carbon intensity sources');
    }

    if (recommendations.length > 0) {
      return {
        originalFlow: flow,
        optimizedFlow,
        savings,
        lossReduction,
        carbonReduction,
        recommendations,
      };
    }

    return null;
  }

  private getMarketPrice(fromCountry: string, toCountry: string): number {
    // Simulate market price lookup
    const basePrices: Record<string, number> = {
      'US': 45.0,
      'CA': 42.0,
      'EU': 52.0,
      'GB': 55.0,
      'CN': 38.0,
      'IN': 35.0,
      'JP': 48.0,
      'KR': 46.0,
      'AU': 40.0,
      'NZ': 42.0,
    };

    const fromPrice = basePrices[fromCountry] || 45.0;
    const toPrice = basePrices[toCountry] || 45.0;

    return (fromPrice + toPrice) / 2;
  }

  async generateFlowForecast(
    fromCountry: string,
    toCountry: string,
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
  ): Promise<FlowForecast> {
    const predictions = [];
    const now = new Date();
    const steps = this.getTimeframeSteps(timeframe);

    for (let i = 1; i <= steps; i++) {
      const timestamp = new Date(now.getTime() + i * this.getTimeframeDuration(timeframe));
      const prediction = this.generateSinglePrediction(fromCountry, toCountry, timestamp);
      predictions.push(prediction);
    }

    return {
      timeframe,
      predictions,
    };
  }

  private getTimeframeSteps(timeframe: string): number {
    const steps = {
      'hour': 24,
      'day': 7,
      'week': 4,
      'month': 12,
    };
    return steps[timeframe] || 7;
  }

  private getTimeframeDuration(timeframe: string): number {
    const durations = {
      'hour': 60 * 60 * 1000, // 1 hour in ms
      'day': 24 * 60 * 60 * 1000, // 1 day in ms
      'week': 7 * 24 * 60 * 60 * 1000, // 1 week in ms
      'month': 30 * 24 * 60 * 60 * 1000, // 1 month in ms
    };
    return durations[timeframe] || 24 * 60 * 60 * 1000;
  }

  private generateSinglePrediction(
    fromCountry: string,
    toCountry: string,
    timestamp: Date,
  ): any {
    const baseVolume = this.getHistoricalAverage(fromCountry, toCountry);
    const seasonalFactor = this.getSeasonalFactor(timestamp);
    const marketFactor = this.getMarketFactor(timestamp);
    
    const expectedVolume = baseVolume * seasonalFactor * marketFactor;
    const expectedPrice = this.getMarketPrice(fromCountry, toCountry) * marketFactor;
    const confidence = 0.85 - (Math.random() * 0.3); // 55-85% confidence

    const factors = [];
    if (seasonalFactor > 1.1) factors.push('high_seasonal_demand');
    if (seasonalFactor < 0.9) factors.push('low_seasonal_demand');
    if (marketFactor > 1.05) factors.push('market_volatility');
    if (Math.random() > 0.8) factors.push('weather_conditions');

    return {
      timestamp,
      fromCountry,
      toCountry,
      expectedVolume,
      expectedPrice,
      confidence,
      factors,
    };
  }

  private getHistoricalAverage(fromCountry: string, toCountry: string): number {
    const historicalFlows = Array.from(this.flows.values())
      .filter(flow => 
        (flow.fromCountry === fromCountry && flow.toCountry === toCountry) ||
        (flow.fromCountry === toCountry && flow.toCountry === fromCountry)
      );

    if (historicalFlows.length === 0) return 1000; // Default

    return historicalFlows.reduce((sum, flow) => sum + flow.volume, 0) / historicalFlows.length;
  }

  private getSeasonalFactor(timestamp: Date): number {
    const month = timestamp.getMonth();
    // Winter months (Dec, Jan, Feb) have higher demand
    if (month === 11 || month === 0 || month === 1) return 1.2;
    // Summer months (Jun, Jul, Aug) have moderate demand
    if (month === 5 || month === 6 || month === 7) return 1.1;
    // Shoulder seasons have lower demand
    return 0.9;
  }

  private getMarketFactor(timestamp: Date): number {
    // Simulate market volatility
    return 0.95 + Math.random() * 0.1; // 0.95-1.05
  }

  async getAllCorridors(): Promise<TransmissionCorridor[]> {
    return Array.from(this.corridors.values());
  }

  async getCorridorById(corridorId: string): Promise<TransmissionCorridor | null> {
    return this.corridors.get(corridorId) || null;
  }

  async getCorridorsByCountry(countryCode: string): Promise<TransmissionCorridor[]> {
    return Array.from(this.corridors.values()).filter(corridor => 
      corridor.fromCountry === countryCode || corridor.toCountry === countryCode
    );
  }

  async addCorridor(corridorData: Partial<TransmissionCorridor>): Promise<TransmissionCorridor> {
    const corridor: TransmissionCorridor = {
      id: `corridor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: corridorData.name || 'New Corridor',
      fromCountry: corridorData.fromCountry || '',
      toCountry: corridorData.toCountry || '',
      type: corridorData.type || 'overhead',
      capacity: corridorData.capacity || 0,
      utilization: corridorData.utilization || 0,
      efficiency: corridorData.efficiency || 95.0,
      age: corridorData.age || 0,
      maintenanceDue: corridorData.maintenanceDue || new Date(),
      expansionPlans: corridorData.expansionPlans || [],
      ...corridorData,
    };

    this.corridors.set(corridor.id, corridor);
    this.logger.log(`Added new transmission corridor: ${corridor.id}`);
    return corridor;
  }

  async getTransmissionEfficiency(): Promise<{
    overallEfficiency: number;
    corridorEfficiencies: Array<{
      corridorId: string;
      name: string;
      efficiency: number;
      losses: number;
    }>;
    recommendations: string[];
  }> {
    const corridors = Array.from(this.corridors.values());
    const overallEfficiency = corridors.reduce((sum, corridor) => sum + corridor.efficiency, 0) / corridors.length;

    const corridorEfficiencies = corridors.map(corridor => ({
      corridorId: corridor.id,
      name: corridor.name,
      efficiency: corridor.efficiency,
      losses: 100 - corridor.efficiency,
    }));

    const recommendations = [];
    const lowEfficiencyCorridors = corridors.filter(c => c.efficiency < 90);
    if (lowEfficiencyCorridors.length > 0) {
      recommendations.push(`Upgrade ${lowEfficiencyCorridors.length} corridors with efficiency below 90%`);
    }

    const agingCorridors = corridors.filter(c => c.age > 30);
    if (agingCorridors.length > 0) {
      recommendations.push(`Consider refurbishment of ${agingCorridors.length} aging corridors`);
    }

    return {
      overallEfficiency,
      corridorEfficiencies,
      recommendations,
    };
  }
}
