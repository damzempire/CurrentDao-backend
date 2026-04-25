import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EnergyGrid {
  id: string;
  name: string;
  countryCode: string;
  region: string;
  type: 'national' | 'regional' | 'microgrid' | 'interconnector';
  capacity: number; // MW
  currentLoad: number; // MW
  frequency: number; // Hz
  voltage: number; // kV
  status: 'active' | 'maintenance' | 'offline' | 'emergency';
  connections: string[]; // Connected grid IDs
  coordinates: {
    latitude: number;
    longitude: number;
  };
  operator: string;
  regulatoryBody: string;
  lastUpdated: Date;
}

export interface GridConnection {
  id: string;
  fromGridId: string;
  toGridId: string;
  capacity: number; // MW
  currentFlow: number; // MW
  direction: 'bidirectional' | 'unidirectional';
  status: 'active' | 'maintenance' | 'offline';
  voltage: number; // kV
  length: number; // km
  efficiency: number; // percentage
  type: 'HVDC' | 'HVAC' | 'submarine';
  commissionedDate: Date;
  lastMaintenance: Date;
}

export interface GridMetrics {
  totalGrids: number;
  activeGrids: number;
  totalCapacity: number; // MW
  currentLoad: number; // MW
  averageFrequency: number; // Hz
  averageVoltage: number; // kV
  gridStability: number; // 0-1
  interconnectivity: number; // 0-1
  redundancyLevel: number; // 0-1
}

export interface GridAlert {
  id: string;
  gridId: string;
  type: 'frequency_deviation' | 'voltage_fluctuation' | 'overload' | 'equipment_failure' | 'cyber_security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  impact: {
    affectedGrids: string[];
    estimatedCustomers: number;
    estimatedDuration: number; // minutes
  };
}

@Injectable()
export class InternationalGridService {
  private readonly logger = new Logger(InternationalGridService.name);
  private grids: Map<string, EnergyGrid> = new Map();
  private connections: Map<string, GridConnection> = new Map();
  private alerts: GridAlert[] = [];

  constructor(private readonly configService: ConfigService) {
    this.initializeGrids();
    this.initializeConnections();
    this.startMonitoring();
  }

  private initializeGrids(): void {
    const sampleGrids: EnergyGrid[] = [
      {
        id: 'US_NERC',
        name: 'North American Electric Reliability Corporation',
        countryCode: 'US',
        region: 'North America',
        type: 'national',
        capacity: 1200000, // 1.2 TW
        currentLoad: 980000,
        frequency: 60.0,
        voltage: 345,
        status: 'active',
        connections: ['CA_IESO', 'MX_CENACE'],
        coordinates: { latitude: 39.8283, longitude: -98.5795 },
        operator: 'NERC',
        regulatoryBody: 'FERC',
        lastUpdated: new Date(),
      },
      {
        id: 'EU_ENTSOE',
        name: 'European Network of Transmission System Operators for Electricity',
        countryCode: 'EU',
        region: 'Europe',
        type: 'regional',
        capacity: 800000, // 800 GW
        currentLoad: 650000,
        frequency: 50.0,
        voltage: 400,
        status: 'active',
        connections: ['GB_NATIONAL_GRID', 'NO_STATNET'],
        coordinates: { latitude: 50.8503, longitude: 4.3517 },
        operator: 'ENTSO-E',
        regulatoryBody: 'European Commission',
        lastUpdated: new Date(),
      },
      {
        id: 'CN_STATE_GRID',
        name: 'State Grid Corporation of China',
        countryCode: 'CN',
        region: 'Asia',
        type: 'national',
        capacity: 1500000, // 1.5 TW
        currentLoad: 1200000,
        frequency: 50.0,
        voltage: 800,
        status: 'active',
        connections: ['RU_RAO', 'IN_PGCIL'],
        coordinates: { latitude: 35.8617, longitude: 104.1954 },
        operator: 'State Grid',
        regulatoryBody: 'NEA',
        lastUpdated: new Date(),
      },
      {
        id: 'IN_PGCIL',
        name: 'Power Grid Corporation of India',
        countryCode: 'IN',
        region: 'Asia',
        type: 'national',
        capacity: 400000, // 400 GW
        currentLoad: 320000,
        frequency: 50.0,
        voltage: 400,
        status: 'active',
        connections: ['CN_STATE_GRID', 'PK_NTDC'],
        coordinates: { latitude: 20.5937, longitude: 78.9629 },
        operator: 'Power Grid',
        regulatoryBody: 'CEA',
        lastUpdated: new Date(),
      },
      {
        id: 'JP_TEPCO',
        name: 'Tokyo Electric Power Company',
        countryCode: 'JP',
        region: 'Asia',
        type: 'national',
        capacity: 280000, // 280 GW
        currentLoad: 220000,
        frequency: 50.0,
        voltage: 500,
        status: 'active',
        connections: ['KR_KEPCO', 'TW_TAIPOWER'],
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        operator: 'TEPCO',
        regulatoryBody: 'METI',
        lastUpdated: new Date(),
      },
      {
        id: 'AU_NEM',
        name: 'National Electricity Market',
        countryCode: 'AU',
        region: 'Oceania',
        type: 'national',
        capacity: 60000, // 60 GW
        currentLoad: 45000,
        frequency: 50.0,
        voltage: 330,
        status: 'active',
        connections: ['NZ_Transpower'],
        coordinates: { latitude: -25.2744, longitude: 133.7751 },
        operator: 'AEMO',
        regulatoryBody: 'AER',
        lastUpdated: new Date(),
      },
    ];

    sampleGrids.forEach(grid => {
      this.grids.set(grid.id, grid);
    });

    this.logger.log(`Initialized ${sampleGrids.length} energy grids`);
  }

  private initializeConnections(): void {
    const sampleConnections: GridConnection[] = [
      {
        id: 'US_CA_CONNECTION',
        fromGridId: 'US_NERC',
        toGridId: 'CA_IESO',
        capacity: 5000, // 5 GW
        currentFlow: 3200,
        direction: 'bidirectional',
        status: 'active',
        voltage: 345,
        length: 1200,
        efficiency: 0.95,
        type: 'HVDC',
        commissionedDate: new Date('2015-06-15'),
        lastMaintenance: new Date('2024-01-10'),
      },
      {
        id: 'EU_GB_CONNECTION',
        fromGridId: 'EU_ENTSOE',
        toGridId: 'GB_NATIONAL_GRID',
        capacity: 2000, // 2 GW
        currentFlow: 1500,
        direction: 'bidirectional',
        status: 'active',
        voltage: 400,
        length: 250,
        efficiency: 0.98,
        type: 'HVDC',
        commissionedDate: new Date('2020-12-01'),
        lastMaintenance: new Date('2024-02-15'),
      },
      {
        id: 'CN_IN_CONNECTION',
        fromGridId: 'CN_STATE_GRID',
        toGridId: 'IN_PGCIL',
        capacity: 3000, // 3 GW
        currentFlow: 2100,
        direction: 'bidirectional',
        status: 'active',
        voltage: 800,
        length: 3500,
        efficiency: 0.92,
        type: 'HVDC',
        commissionedDate: new Date('2018-09-20'),
        lastMaintenance: new Date('2024-03-01'),
      },
    ];

    sampleConnections.forEach(connection => {
      this.connections.set(connection.id, connection);
    });

    this.logger.log(`Initialized ${sampleConnections.length} grid connections`);
  }

  private startMonitoring(): void {
    // Start real-time monitoring simulation
    setInterval(() => {
      this.updateGridMetrics();
      this.checkForAlerts();
    }, 30000); // Every 30 seconds

    this.logger.log('Started real-time grid monitoring');
  }

  private updateGridMetrics(): void {
    this.grids.forEach(grid => {
      if (grid.status === 'active') {
        // Simulate real-time load variations
        const loadVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
        grid.currentLoad = Math.max(0, grid.currentLoad * (1 + loadVariation));
        
        // Simulate frequency variations
        const frequencyVariation = (Math.random() - 0.5) * 0.1; // ±0.05 Hz variation
        grid.frequency = 60.0 + frequencyVariation; // US grids
        
        // Update timestamp
        grid.lastUpdated = new Date();
      }
    });

    // Update connection flows
    this.connections.forEach(connection => {
      if (connection.status === 'active') {
        const flowVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
        connection.currentFlow = Math.max(0, 
          Math.min(connection.capacity, connection.currentFlow * (1 + flowVariation))
        );
      }
    });
  }

  private checkForAlerts(): void {
    this.grids.forEach(grid => {
      if (grid.status === 'active') {
        // Check frequency deviation
        const targetFrequency = grid.countryCode === 'US' ? 60.0 : 50.0;
        const frequencyDeviation = Math.abs(grid.frequency - targetFrequency);
        
        if (frequencyDeviation > 0.5) {
          this.createAlert({
            gridId: grid.id,
            type: 'frequency_deviation',
            severity: frequencyDeviation > 1.0 ? 'critical' : 'high',
            message: `Frequency deviation of ${frequencyDeviation.toFixed(2)} Hz detected`,
            impact: {
              affectedGrids: [grid.id, ...grid.connections],
              estimatedCustomers: Math.floor(grid.currentLoad / 0.002), // ~2kW per customer
              estimatedDuration: 30,
            },
          });
        }

        // Check overload
        const loadPercentage = (grid.currentLoad / grid.capacity) * 100;
        if (loadPercentage > 95) {
          this.createAlert({
            gridId: grid.id,
            type: 'overload',
            severity: loadPercentage > 99 ? 'critical' : 'high',
            message: `Grid overload at ${loadPercentage.toFixed(1)}% capacity`,
            impact: {
              affectedGrids: [grid.id],
              estimatedCustomers: Math.floor(grid.currentLoad / 0.002),
              estimatedDuration: 60,
            },
          });
        }
      }
    });
  }

  private createAlert(alertData: Partial<GridAlert>): void {
    const alert: GridAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    } as GridAlert;

    this.alerts.push(alert);
    this.logger.warn(`Grid alert created: ${alert.type} for grid ${alert.gridId}`);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  async getAllGrids(): Promise<EnergyGrid[]> {
    return Array.from(this.grids.values());
  }

  async getGridById(gridId: string): Promise<EnergyGrid | null> {
    return this.grids.get(gridId) || null;
  }

  async getGridsByCountry(countryCode: string): Promise<EnergyGrid[]> {
    return Array.from(this.grids.values()).filter(grid => 
      grid.countryCode === countryCode
    );
  }

  async getGridsByRegion(region: string): Promise<EnergyGrid[]> {
    return Array.from(this.grids.values()).filter(grid => 
      grid.region === region
    );
  }

  async getActiveGrids(): Promise<EnergyGrid[]> {
    return Array.from(this.grids.values()).filter(grid => 
      grid.status === 'active'
    );
  }

  async getAllConnections(): Promise<GridConnection[]> {
    return Array.from(this.connections.values());
  }

  async getConnectionById(connectionId: string): Promise<GridConnection | null> {
    return this.connections.get(connectionId) || null;
  }

  async getConnectionsByGrid(gridId: string): Promise<GridConnection[]> {
    return Array.from(this.connections.values()).filter(connection => 
      connection.fromGridId === gridId || connection.toGridId === gridId
    );
  }

  async getGridMetrics(): Promise<GridMetrics> {
    const grids = Array.from(this.grids.values());
    const activeGrids = grids.filter(grid => grid.status === 'active');

    return {
      totalGrids: grids.length,
      activeGrids: activeGrids.length,
      totalCapacity: grids.reduce((sum, grid) => sum + grid.capacity, 0),
      currentLoad: grids.reduce((sum, grid) => sum + grid.currentLoad, 0),
      averageFrequency: activeGrids.length > 0 
        ? activeGrids.reduce((sum, grid) => sum + grid.frequency, 0) / activeGrids.length 
        : 0,
      averageVoltage: activeGrids.length > 0 
        ? activeGrids.reduce((sum, grid) => sum + grid.voltage, 0) / activeGrids.length 
        : 0,
      gridStability: this.calculateGridStability(activeGrids),
      interconnectivity: this.calculateInterconnectivity(),
      redundancyLevel: this.calculateRedundancyLevel(),
    };
  }

  private calculateGridStability(grids: EnergyGrid[]): number {
    if (grids.length === 0) return 0;

    const targetFrequency = grids[0].countryCode === 'US' ? 60.0 : 50.0;
    const frequencyStability = grids.reduce((sum, grid) => {
      const deviation = Math.abs(grid.frequency - targetFrequency);
      return sum + Math.max(0, 1 - deviation / 2.0); // Normalize to 0-1
    }, 0) / grids.length;

    const loadBalance = grids.reduce((sum, grid) => {
      const loadRatio = grid.currentLoad / grid.capacity;
      return sum + Math.max(0, 1 - Math.abs(loadRatio - 0.8) * 2); // Optimal around 80%
    }, 0) / grids.length;

    return (frequencyStability + loadBalance) / 2;
  }

  private calculateInterconnectivity(): number {
    const totalGrids = this.grids.size;
    const totalConnections = this.connections.size;
    const maxPossibleConnections = totalGrids * (totalGrids - 1) / 2;
    
    return maxPossibleConnections > 0 ? totalConnections / maxPossibleConnections : 0;
  }

  private calculateRedundancyLevel(): number {
    const grids = Array.from(this.grids.values());
    const connectedGrids = grids.filter(grid => grid.connections.length > 0);
    
    return grids.length > 0 ? connectedGrids.length / grids.length : 0;
  }

  async getActiveAlerts(severity?: string): Promise<GridAlert[]> {
    let alerts = this.alerts.filter(alert => !alert.resolved);
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAlertsByGrid(gridId: string): Promise<GridAlert[]> {
    return this.alerts
      .filter(alert => alert.gridId === gridId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.log(`Alert ${alertId} resolved`);
      return true;
    }
    return false;
  }

  async addGrid(gridData: Partial<EnergyGrid>): Promise<EnergyGrid> {
    const grid: EnergyGrid = {
      id: `grid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: gridData.name || 'New Grid',
      countryCode: gridData.countryCode || '',
      region: gridData.region || '',
      type: gridData.type || 'national',
      capacity: gridData.capacity || 0,
      currentLoad: gridData.currentLoad || 0,
      frequency: gridData.frequency || 50.0,
      voltage: gridData.voltage || 400,
      status: gridData.status || 'active',
      connections: gridData.connections || [],
      coordinates: gridData.coordinates || { latitude: 0, longitude: 0 },
      operator: gridData.operator || 'Unknown',
      regulatoryBody: gridData.regulatoryBody || 'Unknown',
      lastUpdated: new Date(),
      ...gridData,
    };

    this.grids.set(grid.id, grid);
    this.logger.log(`Added new grid: ${grid.id}`);
    return grid;
  }

  async updateGrid(gridId: string, updateData: Partial<EnergyGrid>): Promise<boolean> {
    const grid = this.grids.get(gridId);
    if (!grid) {
      return false;
    }

    Object.assign(grid, updateData, { lastUpdated: new Date() });
    this.grids.set(gridId, grid);
    this.logger.log(`Updated grid: ${gridId}`);
    return true;
  }

  async deleteGrid(gridId: string): Promise<boolean> {
    const deleted = this.grids.delete(gridId);
    if (deleted) {
      // Remove related connections
      const relatedConnections = Array.from(this.connections.values())
        .filter(conn => conn.fromGridId === gridId || conn.toGridId === gridId);
      
      relatedConnections.forEach(conn => {
        this.connections.delete(conn.id);
      });

      this.logger.log(`Deleted grid: ${gridId}`);
    }
    return deleted;
  }

  async addConnection(connectionData: Partial<GridConnection>): Promise<GridConnection> {
    const connection: GridConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromGridId: connectionData.fromGridId || '',
      toGridId: connectionData.toGridId || '',
      capacity: connectionData.capacity || 0,
      currentFlow: connectionData.currentFlow || 0,
      direction: connectionData.direction || 'bidirectional',
      status: connectionData.status || 'active',
      voltage: connectionData.voltage || 400,
      length: connectionData.length || 0,
      efficiency: connectionData.efficiency || 0.95,
      type: connectionData.type || 'HVAC',
      commissionedDate: connectionData.commissionedDate || new Date(),
      lastMaintenance: connectionData.lastMaintenance || new Date(),
      ...connectionData,
    };

    this.connections.set(connection.id, connection);

    // Update grid connections
    const fromGrid = this.grids.get(connection.fromGridId);
    if (fromGrid && !fromGrid.connections.includes(connection.toGridId)) {
      fromGrid.connections.push(connection.toGridId);
    }

    const toGrid = this.grids.get(connection.toGridId);
    if (toGrid && !toGrid.connections.includes(connection.fromGridId)) {
      toGrid.connections.push(connection.fromGridId);
    }

    this.logger.log(`Added new connection: ${connection.id}`);
    return connection;
  }

  async optimizeGridFlows(): Promise<{
    optimizations: Array<{
      connectionId: string;
      currentFlow: number;
      recommendedFlow: number;
      savings: number;
      reason: string;
    }>;
    totalSavings: number;
  }> {
    const optimizations = [];
    let totalSavings = 0;

    this.connections.forEach(connection => {
      if (connection.status === 'active') {
        // Simulate optimization algorithm
        const currentEfficiency = connection.efficiency;
        const loadFactor = connection.currentFlow / connection.capacity;
        
        let recommendedFlow = connection.currentFlow;
        let reason = '';

        if (loadFactor > 0.9) {
          // Reduce flow to improve efficiency
          recommendedFlow = connection.capacity * 0.85;
          reason = 'Reduce load to improve efficiency and stability';
        } else if (loadFactor < 0.3 && connection.capacity > 1000) {
          // Increase flow to utilize capacity
          recommendedFlow = connection.capacity * 0.4;
          reason = 'Increase utilization to improve economics';
        }

        if (Math.abs(recommendedFlow - connection.currentFlow) > connection.capacity * 0.05) {
          const savings = Math.abs(connection.currentFlow - recommendedFlow) * 0.001; // $0.001 per MWh
          totalSavings += savings;

          optimizations.push({
            connectionId: connection.id,
            currentFlow: connection.currentFlow,
            recommendedFlow,
            savings,
            reason,
          });
        }
      }
    });

    return {
      optimizations,
      totalSavings,
    };
  }

  async getGridTopology(): Promise<{
    nodes: Array<{
      id: string;
      name: string;
      type: string;
      coordinates: { latitude: number; longitude: number };
      status: string;
    }>;
    edges: Array<{
      id: string;
      from: string;
      to: string;
      capacity: number;
      currentFlow: number;
      status: string;
    }>;
  }> {
    const nodes = Array.from(this.grids.values()).map(grid => ({
      id: grid.id,
      name: grid.name,
      type: grid.type,
      coordinates: grid.coordinates,
      status: grid.status,
    }));

    const edges = Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      from: conn.fromGridId,
      to: conn.toGridId,
      capacity: conn.capacity,
      currentFlow: conn.currentFlow,
      status: conn.status,
    }));

    return { nodes, edges };
  }
}
