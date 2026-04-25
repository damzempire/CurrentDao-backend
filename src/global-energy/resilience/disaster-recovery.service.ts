import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DisasterScenario {
  id: string;
  name: string;
  type: 'natural' | 'cyber' | 'infrastructure' | 'geopolitical' | 'pandemic' | 'market';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  affectedRegions: string[];
  estimatedImpact: {
    gridCapacityLoss: number; // MW
    supplyDisruption: number; // MWh
    economicLoss: number; // USD
    affectedCustomers: number;
    duration: number; // hours
  };
  triggers: string[];
  status: 'active' | 'monitoring' | 'resolved';
  createdAt: Date;
  lastUpdated: Date;
}

export interface RecoveryPlan {
  id: string;
  scenarioId: string;
  name: string;
  priority: 'immediate' | 'urgent' | 'routine';
  phases: Array<{
    id: string;
    name: string;
    description: string;
    duration: number; // hours
    dependencies: string[];
    resources: Array<{
      type: 'personnel' | 'equipment' | 'infrastructure' | 'external';
      name: string;
      quantity: number;
      availability: number; // 0-1
    }>;
    actions: Array<{
      id: string;
      description: string;
      responsible: string;
      estimatedTime: number; // minutes
      successCriteria: string[];
      rollbackPlan: string;
    }>;
    checkpoints: Array<{
      time: number; // minutes from start
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      metrics: Record<string, number>;
    }>;
  }>;
  communicationPlan: {
    stakeholders: Array<{
      name: string;
      role: string;
      contact: string;
      notificationPriority: 'immediate' | 'hourly' | 'daily';
    }>;
    templates: Array<{
      eventType: string;
      channel: 'email' | 'sms' | 'phone' | 'portal';
      message: string;
      frequency: string;
    }>;
  };
  estimatedCost: number;
  estimatedRecoveryTime: number; // hours
  successProbability: number; // 0-1
}

export interface DisasterResponse {
  id: string;
  scenarioId: string;
  planId: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  actualDuration?: number; // hours
  actualCost?: number;
  personnelInvolved: number;
  resourcesUsed: Array<{
    type: string;
    name: string;
    quantity: number;
    cost: number;
  }>;
  milestones: Array<{
    name: string;
    plannedTime: Date;
    actualTime?: Date;
    status: 'pending' | 'completed' | 'delayed' | 'failed';
    issues: string[];
  }>;
  outcomes: {
    servicesRestored: number;
    customersAffected: number;
    downtimeCost: number;
    recoveryEfficiency: number; // 0-1
    lessonsLearned: string[];
  };
}

export interface ResilienceMetrics {
  overallResilience: number; // 0-1
  disasterPreparedness: number; // 0-1
  responseCapability: number; // 0-1
  recoverySpeed: number; // hours
  systemRedundancy: number; // 0-1
  backupReliability: number; // 0-1
  trainingEffectiveness: number; // 0-1
  communicationEfficiency: number; // 0-1
  regionalMetrics: Array<{
    region: string;
    resilience: number;
    recentIncidents: number;
    averageRecoveryTime: number;
    criticalInfrastructure: number;
  }>;
}

@Injectable()
export class DisasterRecoveryService {
  private readonly logger = new Logger(DisasterRecoveryService.name);
  private scenarios: Map<string, DisasterScenario> = new Map();
  private plans: Map<string, RecoveryPlan> = new Map();
  private responses: Map<string, DisasterResponse> = new Map();
  private activeIncidents: Map<string, any> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeScenarios();
    this.initializeRecoveryPlans();
    this.startMonitoring();
  }

  private initializeScenarios(): void {
    const sampleScenarios: DisasterScenario[] = [
      {
        id: 'scenario_hurricane_us',
        name: 'Major Hurricane Impact on US Eastern Grid',
        type: 'natural',
        severity: 'critical',
        probability: 0.15,
        affectedRegions: ['US_Eastern', 'US_Southeastern'],
        estimatedImpact: {
          gridCapacityLoss: 50000, // 50 GW
          supplyDisruption: 1200000, // 1.2 TWh
          economicLoss: 5000000000, // $5B
          affectedCustomers: 15000000,
          duration: 168, // 1 week
        },
        triggers: ['wind_speed_100mph', 'storm_surge_3m', 'power_outages_100k'],
        status: 'monitoring',
        createdAt: new Date(),
        lastUpdated: new Date(),
      },
      {
        id: 'scenario_cyber_attack_eu',
        name: 'Coordinated Cyber Attack on European Grid',
        type: 'cyber',
        severity: 'high',
        probability: 0.08,
        affectedRegions: ['EU_Central', 'EU_Western'],
        estimatedImpact: {
          gridCapacityLoss: 30000, // 30 GW
          supplyDisruption: 600000, // 600 GWh
          economicLoss: 2000000000, // $2B
          affectedCustomers: 8000000,
          duration: 72, // 3 days
        },
        triggers: ['unauthorized_access', 'system_anomalies', 'communication_failure'],
        status: 'monitoring',
        createdAt: new Date(),
        lastUpdated: new Date(),
      },
      {
        id: 'scenario_earthquake_jp',
        name: 'Major Earthquake in Japan',
        type: 'natural',
        severity: 'critical',
        probability: 0.05,
        affectedRegions: ['JP_Eastern', 'JP_Central'],
        estimatedImpact: {
          gridCapacityLoss: 25000, // 25 GW
          supplyDisruption: 400000, // 400 GWh
          economicLoss: 3000000000, // $3B
          affectedCustomers: 12000000,
          duration: 240, // 10 days
        },
        triggers: ['magnitude_7.0', 'infrastructure_damage', 'nuclear_alert'],
        status: 'monitoring',
        createdAt: new Date(),
        lastUpdated: new Date(),
      },
      {
        id: 'scenario_supply_chain_global',
        name: 'Global Energy Supply Chain Disruption',
        type: 'infrastructure',
        severity: 'high',
        probability: 0.12,
        affectedRegions: ['Global'],
        estimatedImpact: {
          gridCapacityLoss: 20000, // 20 GW
          supplyDisruption: 800000, // 800 GWh
          economicLoss: 1500000000, // $1.5B
          affectedCustomers: 5000000,
          duration: 120, // 5 days
        },
        triggers: ['equipment_shortage', 'logistics_disruption', 'price_spike'],
        status: 'monitoring',
        createdAt: new Date(),
        lastUpdated: new Date(),
      },
    ];

    sampleScenarios.forEach(scenario => {
      this.scenarios.set(scenario.id, scenario);
    });

    this.logger.log(`Initialized ${sampleScenarios.length} disaster scenarios`);
  }

  private initializeRecoveryPlans(): void {
    const samplePlans: RecoveryPlan[] = [
      {
        id: 'plan_hurricane_us',
        scenarioId: 'scenario_hurricane_us',
        name: 'US Hurricane Response Plan',
        priority: 'immediate',
        phases: [
          {
            id: 'phase_preparation',
            name: 'Preparation Phase',
            description: 'Pre-storm preparation and resource mobilization',
            duration: 48,
            dependencies: [],
            resources: [
              { type: 'personnel', name: 'Emergency Response Team', quantity: 50, availability: 0.9 },
              { type: 'equipment', name: 'Mobile Generators', quantity: 100, availability: 0.8 },
              { type: 'external', name: 'Utility Contractors', quantity: 20, availability: 0.7 },
            ],
            actions: [
              {
                id: 'action_mobilize_teams',
                description: 'Deploy emergency response teams to affected areas',
                responsible: 'Operations Manager',
                estimatedTime: 60,
                successCriteria: ['Teams deployed within 1 hour', 'All personnel accounted for'],
                rollbackPlan: 'Recall teams if threat level decreases',
              },
              {
                id: 'action_secure_equipment',
                description: 'Position backup generators and critical equipment',
                responsible: 'Logistics Coordinator',
                estimatedTime: 120,
                successCriteria: ['Equipment positioned in safe locations', 'Fuel supplies secured'],
                rollbackPlan: 'Relocate equipment if path changes',
              },
            ],
            checkpoints: [
              { time: 60, status: 'pending', metrics: { teamsDeployed: 0, equipmentPositioned: 0 } },
              { time: 120, status: 'pending', metrics: { teamsDeployed: 0, equipmentPositioned: 0 } },
            ],
          },
          {
            id: 'phase_response',
            name: 'Response Phase',
            description: 'Immediate response and damage assessment',
            duration: 72,
            dependencies: ['phase_preparation'],
            resources: [
              { type: 'personnel', name: 'Damage Assessment Teams', quantity: 30, availability: 0.95 },
              { type: 'equipment', name: 'Repair Equipment', quantity: 200, availability: 0.85 },
            ],
            actions: [
              {
                id: 'action_assess_damage',
                description: 'Conduct comprehensive damage assessment',
                responsible: 'Engineering Manager',
                estimatedTime: 180,
                successCriteria: ['90% of infrastructure assessed', 'Critical needs identified'],
                rollbackPlan: 'Reassess if conditions change',
              },
            ],
            checkpoints: [
              { time: 180, status: 'pending', metrics: { infrastructureAssessed: 0, criticalNeeds: 0 } },
            ],
          },
        ],
        communicationPlan: {
          stakeholders: [
            { name: 'Regulatory Agencies', role: 'Compliance', contact: 'regulatory@energy.gov', notificationPriority: 'immediate' },
            { name: 'Utility Partners', role: 'Coordination', contact: 'partners@energy.gov', notificationPriority: 'hourly' },
            { name: 'Customers', role: 'Information', contact: 'support@energy.gov', notificationPriority: 'daily' },
          ],
          templates: [
            {
              eventType: 'hurricane_warning',
              channel: 'email',
              message: 'Hurricane warning issued. Emergency protocols activated.',
              frequency: 'immediate',
            },
          ],
        },
        estimatedCost: 50000000, // $50M
        estimatedRecoveryTime: 168, // 1 week
        successProbability: 0.85,
      },
    ];

    samplePlans.forEach(plan => {
      this.plans.set(plan.id, plan);
    });

    this.logger.log(`Initialized ${samplePlans.length} recovery plans`);
  }

  private startMonitoring(): void {
    // Monitor for disaster triggers
    setInterval(() => {
      this.checkDisasterTriggers();
      this.updateActiveResponses();
      this.evaluateSystemResilience();
    }, 60000); // Every minute

    this.logger.log('Started disaster recovery monitoring');
  }

  private checkDisasterTriggers(): void {
    // Simulate trigger detection
    this.scenarios.forEach(scenario => {
      if (scenario.status === 'monitoring' && Math.random() < 0.001) { // 0.1% chance per check
        this.activateScenario(scenario.id);
      }
    });
  }

  private updateActiveResponses(): void {
    this.responses.forEach(response => {
      if (response.status === 'in_progress') {
        this.updateResponseProgress(response);
      }
    });
  }

  private updateResponseProgress(response: DisasterResponse): void {
    const plan = this.plans.get(response.planId);
    if (!plan) return;

    // Simulate progress updates
    const elapsedHours = (Date.now() - response.startTime.getTime()) / (1000 * 60 * 60);
    
    response.milestones.forEach(milestone => {
      if (milestone.status === 'pending' && elapsedHours >= 1) {
        milestone.status = Math.random() > 0.2 ? 'completed' : 'delayed';
        milestone.actualTime = new Date();
        if (milestone.status === 'delayed') {
          milestone.issues.push('Resource constraints', 'Weather conditions');
        }
      }
    });

    // Check if response is complete
    const completedMilestones = response.milestones.filter(m => m.status === 'completed').length;
    if (completedMilestones === response.milestones.length) {
      response.status = 'completed';
      response.endTime = new Date();
      response.actualDuration = elapsedHours;
      response.actualCost = plan.estimatedCost * (0.8 + Math.random() * 0.4); // 80-120% of estimated
    }
  }

  private evaluateSystemResilience(): void {
    // Evaluate overall system resilience
    const activeResponsesCount = this.responses.size;
    const completedResponses = Array.from(this.responses.values())
      .filter(r => r.status === 'completed').length;

    if (activeResponsesCount > 0) {
      const recoveryEfficiency = completedResponses / activeResponsesCount;
      this.logger.log(`System resilience evaluation: ${recoveryEfficiency.toFixed(2)} efficiency rate`);
    }
  }

  async getAllScenarios(): Promise<DisasterScenario[]> {
    return Array.from(this.scenarios.values());
  }

  async getScenarioById(scenarioId: string): Promise<DisasterScenario | null> {
    return this.scenarios.get(scenarioId) || null;
  }

  async getScenariosByType(type: string): Promise<DisasterScenario[]> {
    return Array.from(this.scenarios.values()).filter(scenario => 
      scenario.type === type
    );
  }

  async getActiveScenarios(): Promise<DisasterScenario[]> {
    return Array.from(this.scenarios.values()).filter(scenario => 
      scenario.status === 'active'
    );
  }

  async getAllPlans(): Promise<RecoveryPlan[]> {
    return Array.from(this.plans.values());
  }

  async getPlanById(planId: string): Promise<RecoveryPlan | null> {
    return this.plans.get(planId) || null;
  }

  async getPlansByScenario(scenarioId: string): Promise<RecoveryPlan[]> {
    return Array.from(this.plans.values()).filter(plan => 
      plan.scenarioId === scenarioId
    );
  }

  async getAllResponses(): Promise<DisasterResponse[]> {
    return Array.from(this.responses.values());
  }

  async getResponseById(responseId: string): Promise<DisasterResponse | null> {
    return this.responses.get(responseId) || null;
  }

  async getActiveResponses(): Promise<DisasterResponse[]> {
    return Array.from(this.responses.values()).filter(response => 
      response.status === 'in_progress'
    );
  }

  async activateScenario(scenarioId: string): Promise<DisasterResponse | null> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      return null;
    }

    // Find appropriate recovery plan
    const plan = Array.from(this.plans.values()).find(p => p.scenarioId === scenarioId);
    if (!plan) {
      this.logger.warn(`No recovery plan found for scenario ${scenarioId}`);
      return null;
    }

    // Update scenario status
    scenario.status = 'active';
    scenario.lastUpdated = new Date();

    // Create disaster response
    const response: DisasterResponse = {
      id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scenarioId,
      planId: plan.id,
      status: 'initiated',
      startTime: new Date(),
      personnelInvolved: plan.phases.reduce((sum, phase) => 
        sum + phase.resources.filter(r => r.type === 'personnel')
          .reduce((phaseSum, r) => phaseSum + r.quantity, 0), 0),
      resourcesUsed: [],
      milestones: plan.phases.map(phase => ({
        name: phase.name,
        plannedTime: new Date(Date.now() + phase.duration * 60 * 60 * 1000),
        status: 'pending' as const,
        issues: [],
      })),
      outcomes: {
        servicesRestored: 0,
        customersAffected: scenario.estimatedImpact.affectedCustomers,
        downtimeCost: 0,
        recoveryEfficiency: 0,
        lessonsLearned: [],
      },
    };

    this.responses.set(response.id, response);
    this.logger.warn(`Disaster scenario activated: ${scenario.name}. Response ID: ${response.id}`);

    // Initiate response
    response.status = 'in_progress';

    return response;
  }

  async updateResponse(responseId: string, updateData: Partial<DisasterResponse>): Promise<boolean> {
    const response = this.responses.get(responseId);
    if (!response) {
      return false;
    }

    Object.assign(response, updateData);
    this.logger.log(`Updated disaster response: ${responseId}`);
    return true;
  }

  async completeResponse(responseId: string, outcomes: Partial<DisasterResponse['outcomes']>): Promise<boolean> {
    const response = this.responses.get(responseId);
    if (!response) {
      return false;
    }

    response.status = 'completed';
    response.endTime = new Date();
    response.actualDuration = (response.endTime.getTime() - response.startTime.getTime()) / (1000 * 60 * 60);
    
    if (outcomes) {
      Object.assign(response.outcomes, outcomes);
    }

    // Update scenario status
    const scenario = this.scenarios.get(response.scenarioId);
    if (scenario) {
      scenario.status = 'resolved';
      scenario.lastUpdated = new Date();
    }

    this.logger.log(`Completed disaster response: ${responseId}`);
    return true;
  }

  async getResilienceMetrics(): Promise<ResilienceMetrics> {
    const scenarios = Array.from(this.scenarios.values());
    const responses = Array.from(this.responses.values());
    const completedResponses = responses.filter(r => r.status === 'completed');

    const overallResilience = this.calculateOverallResilience(scenarios, completedResponses);
    const disasterPreparedness = this.calculateDisasterPreparedness(scenarios);
    const responseCapability = this.calculateResponseCapability(responses);
    const recoverySpeed = this.calculateRecoverySpeed(completedResponses);
    const systemRedundancy = 0.85; // Simulated value
    const backupReliability = 0.92; // Simulated value
    const trainingEffectiveness = 0.78; // Simulated value
    const communicationEfficiency = 0.88; // Simulated value

    const regionalMetrics = this.calculateRegionalMetrics();

    return {
      overallResilience,
      disasterPreparedness,
      responseCapability,
      recoverySpeed,
      systemRedundancy,
      backupReliability,
      trainingEffectiveness,
      communicationEfficiency,
      regionalMetrics,
    };
  }

  private calculateOverallResilience(scenarios: DisasterScenario[], responses: DisasterResponse[]): number {
    if (responses.length === 0) return 0.8; // Default resilience

    const successfulResponses = responses.filter(r => r.status === 'completed');
    const successRate = successfulResponses.length / responses.length;
    
    const averageRecoveryEfficiency = successfulResponses.reduce((sum, r) => 
      sum + r.outcomes.recoveryEfficiency, 0) / successfulResponses.length;

    return (successRate * 0.6) + (averageRecoveryEfficiency * 0.4);
  }

  private calculateDisasterPreparedness(scenarios: DisasterScenario[]): number {
    const scenariosWithPlans = scenarios.filter(scenario => 
      this.plans.has(scenario.id)
    ).length;

    return scenarios.length > 0 ? scenariosWithPlans / scenarios.length : 0;
  }

  private calculateResponseCapability(responses: DisasterResponse[]): number {
    if (responses.length === 0) return 0.7;

    const activeResponses = responses.filter(r => r.status === 'in_progress');
    const resourceUtilization = activeResponses.reduce((sum, r) => 
      sum + (r.personnelInvolved / 100), 0) / activeResponses.length;

    return Math.min(1, resourceUtilization);
  }

  private calculateRecoverySpeed(responses: DisasterResponse[]): number {
    if (responses.length === 0) return 24; // Default 24 hours

    const averageActualDuration = responses.reduce((sum, r) => 
      sum + (r.actualDuration || 24), 0) / responses.length;

    return averageActualDuration;
  }

  private calculateRegionalMetrics(): Array<{
    region: string;
    resilience: number;
    recentIncidents: number;
    averageRecoveryTime: number;
    criticalInfrastructure: number;
  }> {
    const regions = ['North America', 'Europe', 'Asia Pacific', 'Oceania'];

    return regions.map(region => ({
      region,
      resilience: 0.75 + Math.random() * 0.2, // 75-95%
      recentIncidents: Math.floor(Math.random() * 5),
      averageRecoveryTime: 12 + Math.random() * 36, // 12-48 hours
      criticalInfrastructure: Math.floor(Math.random() * 50) + 10, // 10-60
    }));
  }

  async runDrill(scenarioId: string): Promise<{
    drillId: string;
    scenario: DisasterScenario;
    startTime: Date;
    participants: number;
    objectives: string[];
    results?: {
      success: boolean;
      duration: number;
      issues: string[];
      improvements: string[];
      score: number; // 0-100
    };
  }> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const drill = {
      drillId: `drill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scenario,
      startTime: new Date(),
      participants: Math.floor(Math.random() * 50) + 10,
      objectives: [
        'Test communication protocols',
        'Validate resource mobilization',
        'Assess decision-making processes',
        'Evaluate coordination effectiveness',
      ],
    };

    this.logger.log(`Started disaster recovery drill: ${drill.drillId} for scenario ${scenario.name}`);

    // Simulate drill completion after 30 minutes
    setTimeout(() => {
      const results = {
        success: Math.random() > 0.2,
        duration: 30, // minutes
        issues: ['Communication delays', 'Resource allocation gaps'],
        improvements: ['Enhanced training', 'Updated protocols'],
        score: 70 + Math.random() * 25, // 70-95
      };

      this.logger.log(`Completed drill ${drill.drillId} with score: ${results.score}`);
    }, 30 * 60 * 1000);

    return drill;
  }

  async addScenario(scenarioData: Partial<DisasterScenario>): Promise<DisasterScenario> {
    const scenario: DisasterScenario = {
      id: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: scenarioData.name || 'New Disaster Scenario',
      type: scenarioData.type || 'natural',
      severity: scenarioData.severity || 'medium',
      probability: scenarioData.probability || 0.1,
      affectedRegions: scenarioData.affectedRegions || [],
      estimatedImpact: scenarioData.estimatedImpact || {
        gridCapacityLoss: 0,
        supplyDisruption: 0,
        economicLoss: 0,
        affectedCustomers: 0,
        duration: 0,
      },
      triggers: scenarioData.triggers || [],
      status: 'monitoring',
      createdAt: new Date(),
      lastUpdated: new Date(),
      ...scenarioData,
    };

    this.scenarios.set(scenario.id, scenario);
    this.logger.log(`Added new disaster scenario: ${scenario.id}`);
    return scenario;
  }

  async addRecoveryPlan(planData: Partial<RecoveryPlan>): Promise<RecoveryPlan> {
    const plan: RecoveryPlan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scenarioId: planData.scenarioId || '',
      name: planData.name || 'New Recovery Plan',
      priority: planData.priority || 'urgent',
      phases: planData.phases || [],
      communicationPlan: planData.communicationPlan || {
        stakeholders: [],
        templates: [],
      },
      estimatedCost: planData.estimatedCost || 0,
      estimatedRecoveryTime: planData.estimatedRecoveryTime || 24,
      successProbability: planData.successProbability || 0.8,
      ...planData,
    };

    this.plans.set(plan.id, plan);
    this.logger.log(`Added new recovery plan: ${plan.id}`);
    return plan;
  }

  async generateRecoveryReport(timeframe: 'week' | 'month' | 'quarter' | 'year'): Promise<{
    period: string;
    summary: {
      totalIncidents: number;
      averageResponseTime: number;
      successRate: number;
      totalCost: number;
      customersAffected: number;
    };
    incidents: Array<{
      id: string;
      scenario: string;
      severity: string;
      duration: number;
      cost: number;
      lessons: string[];
    }>;
    recommendations: string[];
    trends: {
      incidentFrequency: 'increasing' | 'decreasing' | 'stable';
      responseEffectiveness: 'improving' | 'declining' | 'stable';
      costPerIncident: 'increasing' | 'decreasing' | 'stable';
    };
  }> {
    const responses = Array.from(this.responses.values());
    const cutoffDate = this.getCutoffDate(timeframe);
    const periodResponses = responses.filter(r => r.startTime >= cutoffDate);

    const summary = {
      totalIncidents: periodResponses.length,
      averageResponseTime: periodResponses.length > 0 
        ? periodResponses.reduce((sum, r) => sum + (r.actualDuration || 24), 0) / periodResponses.length 
        : 0,
      successRate: periodResponses.length > 0 
        ? periodResponses.filter(r => r.status === 'completed').length / periodResponses.length 
        : 0,
      totalCost: periodResponses.reduce((sum, r) => sum + (r.actualCost || 0), 0),
      customersAffected: periodResponses.reduce((sum, r) => sum + r.outcomes.customersAffected, 0),
    };

    const incidents = periodResponses.map(response => {
      const scenario = this.scenarios.get(response.scenarioId);
      return {
        id: response.id,
        scenario: scenario?.name || 'Unknown',
        severity: scenario?.severity || 'medium',
        duration: response.actualDuration || 0,
        cost: response.actualCost || 0,
        lessons: response.outcomes.lessonsLearned,
      };
    });

    const recommendations = this.generateRecommendations(summary, incidents);
    const trends = this.analyzeTrends(responses, timeframe);

    return {
      period: timeframe,
      summary,
      incidents,
      recommendations,
      trends,
    };
  }

  private getCutoffDate(timeframe: string): Date {
    const now = new Date();
    const periods = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };

    const days = periods[timeframe] || 30;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private generateRecommendations(summary: any, incidents: any[]): string[] {
    const recommendations = [];

    if (summary.averageResponseTime > 24) {
      recommendations.push('Improve response time through better resource allocation');
    }

    if (summary.successRate < 0.9) {
      recommendations.push('Enhance training and update recovery procedures');
    }

    if (summary.totalCost > 100000000) {
      recommendations.push('Optimize cost structure through preventive measures');
    }

    const criticalIncidents = incidents.filter(i => i.severity === 'critical');
    if (criticalIncidents.length > 0) {
      recommendations.push('Strengthen critical infrastructure resilience');
    }

    return recommendations;
  }

  private analyzeTrends(responses: DisasterResponse[], timeframe: string): any {
    const recentPeriod = this.getCutoffDate(timeframe);
    const previousPeriod = new Date(recentPeriod.getTime() - (recentPeriod.getTime() - Date.now()));

    const recentResponses = responses.filter(r => r.startTime >= recentPeriod);
    const previousResponses = responses.filter(r => r.startTime >= previousPeriod && r.startTime < recentPeriod);

    return {
      incidentFrequency: this.compareTrends(recentResponses.length, previousResponses.length),
      responseEffectiveness: this.compareEffectiveness(recentResponses, previousResponses),
      costPerIncident: this.compareCosts(recentResponses, previousResponses),
    };
  }

  private compareTrends(recent: number, previous: number): 'increasing' | 'decreasing' | 'stable' {
    if (recent > previous * 1.1) return 'increasing';
    if (recent < previous * 0.9) return 'decreasing';
    return 'stable';
  }

  private compareEffectiveness(recent: DisasterResponse[], previous: DisasterResponse[]): 'improving' | 'declining' | 'stable' {
    const recentSuccess = recent.filter(r => r.status === 'completed').length / recent.length;
    const previousSuccess = previous.filter(r => r.status === 'completed').length / previous.length;

    return this.compareTrends(recentSuccess, previousSuccess) as any;
  }

  private compareCosts(recent: DisasterResponse[], previous: DisasterResponse[]): 'increasing' | 'decreasing' | 'stable' {
    const recentAvgCost = recent.reduce((sum, r) => sum + (r.actualCost || 0), 0) / recent.length;
    const previousAvgCost = previous.reduce((sum, r) => sum + (r.actualCost || 0), 0) / previous.length;

    return this.compareTrends(recentAvgCost, previousAvgCost) as any;
  }
}
