import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BalancingArea {
  id: string;
  name: string;
  countryCode: string;
  region: string;
  type: 'national' | 'regional' | 'zonal';
  controlArea: string;
  frequency: number; // Hz
  tolerance: number; // Hz
  reserveCapacity: number; // MW
  activatedReserves: number; // MW
  imbalance: number; // MW
  status: 'balanced' | 'deficit' | 'surplus' | 'critical';
  lastUpdated: Date;
}

export interface BalancingReserve {
  id: string;
  balancingAreaId: string;
  type: 'spinning' | 'non_spinning' | 'regulation' | 'supplemental';
  capacity: number; // MW
  activatedCapacity: number; // MW
  deploymentTime: number; // minutes
  cost: number; // USD/MW
  provider: string;
  status: 'available' | 'activated' | 'depleted' | 'maintenance';
  activationTime?: Date;
  deactivationTime?: Date;
}

export interface BalancingMarket {
  id: string;
  name: string;
  balancingAreaId: string;
  type: 'primary' | 'secondary' | 'tertiary';
  settlementPeriod: number; // minutes
  priceCap: number; // USD/MWh
  totalDemand: number; // MW
  totalSupply: number; // MW;
  clearingPrice: number; // USD/MWh
  activatedVolume: number; // MW
  status: 'open' | 'closed' | 'settled';
  lastUpdated: Date;
}

export interface BalancingAction {
  id: string;
  balancingAreaId: string;
  type: 'load_shedding' | 'generation_dispatch' | 'reserve_activation' | 'import' | 'export';
  volume: number; // MW
  direction: 'increase' | 'decrease';
  priority: 'emergency' | 'economic' | 'routine';
  executionTime: Date;
  duration: number; // minutes
  cost: number; // USD
  reason: string;
  status: 'planned' | 'executed' | 'cancelled';
  impact: {
    frequencyCorrection: number; // Hz
    voltageStability: number; // 0-1
    customerImpact: number; // 0-1
  };
}

export interface BalancingMetrics {
  totalBalancingAreas: number;
  balancedAreas: number;
  totalReserveCapacity: number;
  activatedReserves: number;
  averageFrequency: number; // Hz
  frequencyStability: number; // 0-1
  totalImbalance: number; // MW
  balancingCosts: number; // USD
  reserveUtilization: number; // 0-1
  responseTime: number; // minutes
}

@Injectable()
export class GlobalBalancingService {
  private readonly logger = new Logger(GlobalBalancingService.name);
  private balancingAreas: Map<string, BalancingArea> = new Map();
  private reserves: Map<string, BalancingReserve> = new Map();
  private markets: Map<string, BalancingMarket> = new Map();
  private actions: Map<string, BalancingAction> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeBalancingAreas();
    this.initializeReserves();
    this.startBalancingMonitoring();
  }

  private initializeBalancingAreas(): void {
    const sampleAreas: BalancingArea[] = [
      {
        id: 'BA_US_EASTERN',
        name: 'US Eastern Interconnection',
        countryCode: 'US',
        region: 'North America',
        type: 'national',
        controlArea: 'NERC',
        frequency: 60.0,
        tolerance: 0.05,
        reserveCapacity: 15000,
        activatedReserves: 1200,
        imbalance: -800,
        status: 'deficit',
        lastUpdated: new Date(),
      },
      {
        id: 'BA_EU_CENTRAL',
        name: 'Central European Balancing Area',
        countryCode: 'DE',
        region: 'Europe',
        type: 'regional',
        controlArea: 'ENTSO-E',
        frequency: 50.0,
        tolerance: 0.05,
        reserveCapacity: 12000,
        activatedReserves: 800,
        imbalance: 300,
        status: 'balanced',
        lastUpdated: new Date(),
      },
      {
        id: 'BA_CN_EASTERN',
        name: 'China Eastern Grid',
        countryCode: 'CN',
        region: 'Asia',
        type: 'national',
        controlArea: 'State Grid',
        frequency: 50.0,
        tolerance: 0.1,
        reserveCapacity: 20000,
        activatedReserves: 2500,
        imbalance: -1500,
        status: 'deficit',
        lastUpdated: new Date(),
      },
      {
        id: 'BA_JP_EASTERN',
        name: 'Japan Eastern Grid',
        countryCode: 'JP',
        region: 'Asia',
        type: 'regional',
        controlArea: 'TEPCO',
        frequency: 50.0,
        tolerance: 0.05,
        reserveCapacity: 8000,
        activatedReserves: 600,
        imbalance: 100,
        status: 'balanced',
        lastUpdated: new Date(),
      },
      {
        id: 'BA_AU_NEM',
        name: 'Australian National Electricity Market',
        countryCode: 'AU',
        region: 'Oceania',
        type: 'national',
        controlArea: 'AEMO',
        frequency: 50.0,
        tolerance: 0.1,
        reserveCapacity: 5000,
        activatedReserves: 400,
        imbalance: -200,
        status: 'balanced',
        lastUpdated: new Date(),
      },
    ];

    sampleAreas.forEach(area => {
      this.balancingAreas.set(area.id, area);
    });

    this.logger.log(`Initialized ${sampleAreas.length} balancing areas`);
  }

  private initializeReserves(): void {
    const sampleReserves: BalancingReserve[] = [
      {
        id: 'reserve_us_eastern_001',
        balancingAreaId: 'BA_US_EASTERN',
        type: 'spinning',
        capacity: 5000,
        activatedCapacity: 800,
        deploymentTime: 10,
        cost: 25.50,
        provider: 'Exelon Power',
        status: 'activated',
        activationTime: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: 'reserve_eu_central_001',
        balancingAreaId: 'BA_EU_CENTRAL',
        type: 'regulation',
        capacity: 3000,
        activatedCapacity: 400,
        deploymentTime: 5,
        cost: 18.75,
        provider: 'RWE',
        status: 'activated',
        activationTime: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        id: 'reserve_cn_eastern_001',
        balancingAreaId: 'BA_CN_EASTERN',
        type: 'spinning',
        capacity: 8000,
        activatedCapacity: 1500,
        deploymentTime: 15,
        cost: 12.30,
        provider: 'China Huadian',
        status: 'activated',
        activationTime: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        id: 'reserve_jp_eastern_001',
        balancingAreaId: 'BA_JP_EASTERN',
        type: 'non_spinning',
        capacity: 2000,
        activatedCapacity: 300,
        deploymentTime: 20,
        cost: 35.80,
        provider: 'TEPCO',
        status: 'available',
      },
      {
        id: 'reserve_au_nem_001',
        balancingAreaId: 'BA_AU_NEM',
        type: 'supplemental',
        capacity: 1500,
        activatedCapacity: 200,
        deploymentTime: 30,
        cost: 28.90,
        provider: 'AGL Energy',
        status: 'available',
      },
    ];

    sampleReserves.forEach(reserve => {
      this.reserves.set(reserve.id, reserve);
    });

    this.logger.log(`Initialized ${sampleReserves.length} balancing reserves`);
  }

  private startBalancingMonitoring(): void {
    setInterval(() => {
      this.updateBalancingMetrics();
      this.checkImbalanceConditions();
      this.optimizeReserveAllocation();
    }, 30000); // Every 30 seconds

    this.logger.log('Started global balancing monitoring');
  }

  private updateBalancingMetrics(): void {
    this.balancingAreas.forEach(area => {
      // Simulate real-time frequency variations
      const frequencyVariation = (Math.random() - 0.5) * 0.02; // ±0.01 Hz
      area.frequency = (area.countryCode === 'US' ? 60.0 : 50.0) + frequencyVariation;
      
      // Simulate imbalance variations
      const imbalanceVariation = (Math.random() - 0.5) * 200; // ±100 MW
      area.imbalance += imbalanceVariation;
      
      // Update status based on imbalance
      const imbalancePercentage = Math.abs(area.imbalance) / area.reserveCapacity;
      if (imbalancePercentage > 0.8) {
        area.status = 'critical';
      } else if (area.imbalance < -100) {
        area.status = 'deficit';
      } else if (area.imbalance > 100) {
        area.status = 'surplus';
      } else {
        area.status = 'balanced';
      }
      
      area.lastUpdated = new Date();
    });

    // Update reserve activation
    this.reserves.forEach(reserve => {
      if (reserve.status === 'activated') {
        const activationVariation = (Math.random() - 0.5) * 50; // ±25 MW
        reserve.activatedCapacity = Math.max(0, 
          Math.min(reserve.capacity, reserve.activatedCapacity + activationVariation)
        );
      }
    });
  }

  private checkImbalanceConditions(): void {
    this.balancingAreas.forEach(area => {
      if (area.status === 'critical' || area.status === 'deficit') {
        this.triggerBalancingAction(area);
      }
    });
  }

  private triggerBalancingAction(area: BalancingArea): void {
    const actionType = this.determineActionType(area);
    const volume = Math.min(Math.abs(area.imbalance), this.getAvailableReserveCapacity(area.id));
    
    if (volume > 0) {
      const action: BalancingAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        balancingAreaId: area.id,
        type: actionType,
        volume,
        direction: area.imbalance < 0 ? 'increase' : 'decrease',
        priority: area.status === 'critical' ? 'emergency' : 'economic',
        executionTime: new Date(),
        duration: 60,
        cost: volume * this.getBalancingCost(area.id, actionType),
        reason: `Automatic response to ${area.status} condition`,
        status: 'executed',
        impact: {
          frequencyCorrection: volume / area.reserveCapacity * 0.1,
          voltageStability: 0.95,
          customerImpact: area.status === 'critical' ? 0.3 : 0.1,
        },
      };

      this.actions.set(action.id, action);
      this.logger.log(`Triggered balancing action: ${action.type} for area ${area.id}, volume ${volume} MW`);
    }
  }

  private determineActionType(area: BalancingArea): 'load_shedding' | 'generation_dispatch' | 'reserve_activation' | 'import' | 'export' {
    const availableReserves = this.getAvailableReserveCapacity(area.id);
    
    if (availableReserves > Math.abs(area.imbalance) * 0.8) {
      return 'reserve_activation';
    } else if (area.imbalance < 0) {
      return 'import';
    } else {
      return 'export';
    }
  }

  private getAvailableReserveCapacity(balancingAreaId: string): number {
    return Array.from(this.reserves.values())
      .filter(reserve => 
        reserve.balancingAreaId === balancingAreaId && 
        reserve.status === 'available'
      )
      .reduce((sum, reserve) => sum + (reserve.capacity - reserve.activatedCapacity), 0);
  }

  private getBalancingCost(balancingAreaId: string, actionType: string): number {
    const reserves = Array.from(this.reserves.values())
      .filter(reserve => reserve.balancingAreaId === balancingAreaId);
    
    if (reserves.length === 0) return 50; // Default cost

    return reserves.reduce((sum, reserve) => sum + reserve.cost, 0) / reserves.length;
  }

  private optimizeReserveAllocation(): void {
    this.balancingAreas.forEach(area => {
      const activatedReserves = Array.from(this.reserves.values())
        .filter(reserve => 
          reserve.balancingAreaId === area.id && 
          reserve.status === 'activated'
        );

      // Check if reserves can be deactivated
      activatedReserves.forEach(reserve => {
        if (area.status === 'balanced' && Math.abs(area.imbalance) < reserve.activatedCapacity * 0.5) {
          reserve.status = 'available';
          reserve.activatedCapacity = 0;
          reserve.deactivationTime = new Date();
          area.activatedReserves -= reserve.capacity;
          this.logger.log(`Deactivated reserve ${reserve.id} in area ${area.id}`);
        }
      });
    });
  }

  async getAllBalancingAreas(): Promise<BalancingArea[]> {
    return Array.from(this.balancingAreas.values());
  }

  async getBalancingAreaById(areaId: string): Promise<BalancingArea | null> {
    return this.balancingAreas.get(areaId) || null;
  }

  async getBalancingAreasByCountry(countryCode: string): Promise<BalancingArea[]> {
    return Array.from(this.balancingAreas.values()).filter(area => 
      area.countryCode === countryCode
    );
  }

  async getCriticalBalancingAreas(): Promise<BalancingArea[]> {
    return Array.from(this.balancingAreas.values()).filter(area => 
      area.status === 'critical'
    );
  }

  async getAllReserves(): Promise<BalancingReserve[]> {
    return Array.from(this.reserves.values());
  }

  async getReservesByArea(balancingAreaId: string): Promise<BalancingReserve[]> {
    return Array.from(this.reserves.values()).filter(reserve => 
      reserve.balancingAreaId === balancingAreaId
    );
  }

  async getAvailableReserves(balancingAreaId: string): Promise<BalancingReserve[]> {
    return Array.from(this.reserves.values()).filter(reserve => 
      reserve.balancingAreaId === balancingAreaId && 
      reserve.status === 'available'
    );
  }

  async activateReserve(reserveId: string, volume: number): Promise<boolean> {
    const reserve = this.reserves.get(reserveId);
    if (!reserve || reserve.status !== 'available') {
      return false;
    }

    const activationVolume = Math.min(volume, reserve.capacity - reserve.activatedCapacity);
    reserve.activatedCapacity += activationVolume;
    reserve.status = 'activated';
    reserve.activationTime = new Date();

    // Update balancing area
    const area = this.balancingAreas.get(reserve.balancingAreaId);
    if (area) {
      area.activatedReserves += activationVolume;
    }

    this.logger.log(`Activated reserve ${reserveId}: ${activationVolume} MW`);
    return true;
  }

  async deactivateReserve(reserveId: string): Promise<boolean> {
    const reserve = this.reserves.get(reserveId);
    if (!reserve || reserve.status !== 'activated') {
      return false;
    }

    const deactivatedVolume = reserve.activatedCapacity;
    reserve.activatedCapacity = 0;
    reserve.status = 'available';
    reserve.deactivationTime = new Date();

    // Update balancing area
    const area = this.balancingAreas.get(reserve.balancingAreaId);
    if (area) {
      area.activatedReserves -= deactivatedVolume;
    }

    this.logger.log(`Deactivated reserve ${reserveId}: ${deactivatedVolume} MW`);
    return true;
  }

  async getBalancingActions(areaId?: string): Promise<BalancingAction[]> {
    let actions = Array.from(this.actions.values());
    
    if (areaId) {
      actions = actions.filter(action => action.balancingAreaId === areaId);
    }
    
    return actions.sort((a, b) => b.executionTime.getTime() - a.executionTime.getTime());
  }

  async executeBalancingAction(actionData: Partial<BalancingAction>): Promise<BalancingAction> {
    const action: BalancingAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      balancingAreaId: actionData.balancingAreaId || '',
      type: actionData.type || 'reserve_activation',
      volume: actionData.volume || 0,
      direction: actionData.direction || 'increase',
      priority: actionData.priority || 'economic',
      executionTime: new Date(),
      duration: actionData.duration || 60,
      cost: actionData.cost || 0,
      reason: actionData.reason || 'Manual intervention',
      status: 'executed',
      impact: actionData.impact || {
        frequencyCorrection: 0,
        voltageStability: 1,
        customerImpact: 0,
      },
      ...actionData,
    };

    this.actions.set(action.id, action);
    this.logger.log(`Executed balancing action: ${action.type} for area ${action.balancingAreaId}`);
    return action;
  }

  async getBalancingMetrics(): Promise<BalancingMetrics> {
    const areas = Array.from(this.balancingAreas.values());
    const balancedAreas = areas.filter(area => area.status === 'balanced');
    const reserves = Array.from(this.reserves.values());
    const activatedReserves = reserves.filter(reserve => reserve.status === 'activated');

    return {
      totalBalancingAreas: areas.length,
      balancedAreas: balancedAreas.length,
      totalReserveCapacity: reserves.reduce((sum, reserve) => sum + reserve.capacity, 0),
      activatedReserves: activatedReserves.reduce((sum, reserve) => sum + reserve.activatedCapacity, 0),
      averageFrequency: areas.reduce((sum, area) => sum + area.frequency, 0) / areas.length,
      frequencyStability: this.calculateFrequencyStability(areas),
      totalImbalance: areas.reduce((sum, area) => sum + Math.abs(area.imbalance), 0),
      balancingCosts: this.calculateBalancingCosts(),
      reserveUtilization: this.calculateReserveUtilization(reserves),
      responseTime: this.calculateAverageResponseTime(),
    };
  }

  private calculateFrequencyStability(areas: BalancingArea[]): number {
    if (areas.length === 0) return 0;

    const targetFrequency = areas[0].countryCode === 'US' ? 60.0 : 50.0;
    const totalDeviation = areas.reduce((sum, area) => {
      const deviation = Math.abs(area.frequency - targetFrequency);
      return sum + Math.max(0, 1 - deviation / area.tolerance);
    }, 0);

    return totalDeviation / areas.length;
  }

  private calculateBalancingCosts(): number {
    const todayActions = Array.from(this.actions.values())
      .filter(action => action.executionTime >= new Date(Date.now() - 24 * 60 * 60 * 1000));

    return todayActions.reduce((sum, action) => sum + action.cost, 0);
  }

  private calculateReserveUtilization(reserves: BalancingReserve[]): number {
    const totalCapacity = reserves.reduce((sum, reserve) => sum + reserve.capacity, 0);
    const totalActivated = reserves.reduce((sum, reserve) => sum + reserve.activatedCapacity, 0);

    return totalCapacity > 0 ? totalActivated / totalCapacity : 0;
  }

  private calculateAverageResponseTime(): number {
    const reserves = Array.from(this.reserves.values());
    if (reserves.length === 0) return 0;

    return reserves.reduce((sum, reserve) => sum + reserve.deploymentTime, 0) / reserves.length;
  }

  async getCrossBorderBalancingOpportunities(): Promise<Array<{
    fromArea: string;
    toArea: string;
    potentialVolume: number;
    cost: number;
    frequencyBenefit: number;
  }>> {
    const opportunities = [];
    const deficitAreas = Array.from(this.balancingAreas.values())
      .filter(area => area.status === 'deficit' || area.status === 'critical');
    const surplusAreas = Array.from(this.balancingAreas.values())
      .filter(area => area.status === 'surplus');

    deficitAreas.forEach(deficitArea => {
      surplusAreas.forEach(surplusArea => {
        if (deficitArea.id !== surplusArea.id) {
          const transmissionCost = this.estimateTransmissionCost(deficitArea, surplusArea);
          const potentialVolume = Math.min(
            Math.abs(deficitArea.imbalance),
            surplusArea.imbalance
          );

          if (potentialVolume > 0) {
            opportunities.push({
              fromArea: surplusArea.name,
              toArea: deficitArea.name,
              potentialVolume,
              cost: potentialVolume * transmissionCost,
              frequencyBenefit: potentialVolume / deficitArea.reserveCapacity * 0.05,
            });
          }
        }
      });
    });

    return opportunities.sort((a, b) => b.frequencyBenefit - a.frequencyBenefit);
  }

  private estimateTransmissionCost(area1: BalancingArea, area2: BalancingArea): number {
    // Simplified transmission cost estimation
    const baseCosts: Record<string, number> = {
      'US-EU': 25,
      'US-CN': 30,
      'EU-CN': 35,
      'US-JP': 40,
      'EU-JP': 38,
      'CN-JP': 15,
      'AU-ASIA': 45,
    };

    const key = `${area1.countryCode}-${area2.countryCode}` || `${area2.countryCode}-${area1.countryCode}`;
    return baseCosts[key] || 20; // Default $20/MWh
  }

  async addBalancingArea(areaData: Partial<BalancingArea>): Promise<BalancingArea> {
    const area: BalancingArea = {
      id: `ba_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: areaData.name || 'New Balancing Area',
      countryCode: areaData.countryCode || '',
      region: areaData.region || '',
      type: areaData.type || 'regional',
      controlArea: areaData.controlArea || 'Unknown',
      frequency: areaData.frequency || 50.0,
      tolerance: areaData.tolerance || 0.05,
      reserveCapacity: areaData.reserveCapacity || 0,
      activatedReserves: areaData.activatedReserves || 0,
      imbalance: areaData.imbalance || 0,
      status: areaData.status || 'balanced',
      lastUpdated: new Date(),
      ...areaData,
    };

    this.balancingAreas.set(area.id, area);
    this.logger.log(`Added new balancing area: ${area.id}`);
    return area;
  }

  async addReserve(reserveData: Partial<BalancingReserve>): Promise<BalancingReserve> {
    const reserve: BalancingReserve = {
      id: `reserve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      balancingAreaId: reserveData.balancingAreaId || '',
      type: reserveData.type || 'spinning',
      capacity: reserveData.capacity || 0,
      activatedCapacity: reserveData.activatedCapacity || 0,
      deploymentTime: reserveData.deploymentTime || 10,
      cost: reserveData.cost || 0,
      provider: reserveData.provider || 'Unknown',
      status: reserveData.status || 'available',
      ...reserveData,
    };

    this.reserves.set(reserve.id, reserve);
    this.logger.log(`Added new balancing reserve: ${reserve.id}`);
    return reserve;
  }
}
