import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ComplianceRegulation {
  id: string;
  name: string;
  type: 'emissions' | 'safety' | 'market' | 'grid' | 'environmental' | 'trade';
  jurisdiction: string;
  countryCode: string;
  region: string;
  description: string;
  requirements: string[];
  penalties: Array<{
    type: 'fine' | 'suspension' | 'revocation';
    amount?: number;
    duration?: number;
    description: string;
  }>;
  effectiveDate: Date;
  expiryDate?: Date;
  status: 'active' | 'pending' | 'expired' | 'suspended';
  lastUpdated: Date;
}

export interface ComplianceCheck {
  id: string;
  entityId: string;
  entityType: 'grid' | 'market' | 'flow' | 'participant' | 'facility';
  regulationId: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'exempt';
  score: number; // 0-100
  findings: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    recommendation: string;
    dueDate: Date;
  }>;
  checkedAt: Date;
  nextCheckDate: Date;
  checkedBy: string;
}

export interface ComplianceReport {
  id: string;
  title: string;
  type: 'annual' | 'quarterly' | 'monthly' | 'incident';
  jurisdiction: string;
  countryCode: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalChecks: number;
    compliantChecks: number;
    nonCompliantChecks: number;
    pendingChecks: number;
    averageScore: number;
    criticalFindings: number;
  };
  recommendations: string[];
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    description: string;
    responsible: string;
    dueDate: Date;
  }>;
  generatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ComplianceAlert {
  id: string;
  entityId: string;
  entityType: string;
  regulationId: string;
  type: 'violation' | 'deadline' | 'requirement' | 'audit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ComplianceMetrics {
  totalRegulations: number;
  activeRegulations: number;
  totalChecks: number;
  compliantRate: number;
  averageScore: number;
  criticalViolations: number;
  overdueChecks: number;
  upcomingDeadlines: number;
  regionalCompliance: Record<string, {
    regulations: number;
    compliance: number;
    score: number;
  }>;
}

@Injectable()
export class InternationalComplianceService {
  private readonly logger = new Logger(InternationalComplianceService.name);
  private regulations: Map<string, ComplianceRegulation> = new Map();
  private checks: Map<string, ComplianceCheck> = new Map();
  private reports: Map<string, ComplianceReport> = new Map();
  private alerts: ComplianceAlert[] = [];

  constructor(private readonly configService: ConfigService) {
    this.initializeRegulations();
    this.startComplianceMonitoring();
  }

  private initializeRegulations(): void {
    const sampleRegulations: ComplianceRegulation[] = [
      {
        id: 'EU_EUETS',
        name: 'EU Emissions Trading System',
        type: 'emissions',
        jurisdiction: 'European Union',
        countryCode: 'EU',
        region: 'Europe',
        description: 'Carbon emissions trading scheme for power plants and industries',
        requirements: [
          'Monitor and report CO2 emissions',
          'Sufficient allowances for emissions',
          'Annual compliance report',
          'Third-party verification',
        ],
        penalties: [
          {
            type: 'fine',
            amount: 100,
            description: '€100 per ton of excess emissions',
          },
          {
            type: 'suspension',
            duration: 365,
            description: 'Trading suspension for repeated violations',
          },
        ],
        effectiveDate: new Date('2005-01-01'),
        status: 'active',
        lastUpdated: new Date(),
      },
      {
        id: 'US_NERC',
        name: 'NERC Reliability Standards',
        type: 'grid',
        jurisdiction: 'North America',
        countryCode: 'US',
        region: 'North America',
        description: 'Mandatory reliability standards for bulk power system',
        requirements: [
          'Reliability coordination',
          'System operating limits',
          'Disturbance monitoring',
          'Emergency preparedness',
        ],
        penalties: [
          {
            type: 'fine',
            amount: 1000000,
            description: 'Up to $1M per day per violation',
          },
          {
            type: 'suspension',
            description: 'Operating privileges suspension',
          },
        ],
        effectiveDate: new Date('2007-06-18'),
        status: 'active',
        lastUpdated: new Date(),
      },
      {
        id: 'CN_CEL',
        name: 'China Electricity Law',
        type: 'grid',
        jurisdiction: 'People\'s Republic of China',
        countryCode: 'CN',
        region: 'Asia',
        description: 'Comprehensive electricity market and grid operation regulations',
        requirements: [
          'Grid safety standards',
          'Market operation compliance',
          'Renewable energy integration',
          'Consumer protection',
        ],
        penalties: [
          {
            type: 'fine',
            amount: 5000000,
            description: 'Up to ¥5M for serious violations',
          },
          {
            type: 'revocation',
            description: 'License revocation for severe violations',
          },
        ],
        effectiveDate: new Date('1996-04-01'),
        status: 'active',
        lastUpdated: new Date(),
      },
      {
        id: 'JP_EG',
        name: 'Japan Electricity Gas Law',
        type: 'market',
        jurisdiction: 'Japan',
        countryCode: 'JP',
        region: 'Asia',
        description: 'Regulation of electricity and gas utilities',
        requirements: [
          'Fair market competition',
          'Supply security',
          'Tariff regulation',
          'Service quality standards',
        ],
        penalties: [
          {
            type: 'fine',
            amount: 10000000,
            description: 'Up to ¥10M for violations',
          },
          {
            type: 'suspension',
            duration: 180,
            description: 'Business suspension for violations',
          },
        ],
        effectiveDate: new Date('2003-04-01'),
        status: 'active',
        lastUpdated: new Date(),
      },
      {
        id: 'AU_NEM',
        name: 'Australian National Electricity Rules',
        type: 'market',
        jurisdiction: 'Australia',
        countryCode: 'AU',
        region: 'Oceania',
        description: 'Rules governing the National Electricity Market',
        requirements: [
          'Market participation rules',
          'System security standards',
          'Consumer protection',
          'Environmental compliance',
        ],
        penalties: [
          {
            type: 'fine',
            amount: 1000000,
            description: 'Up to AU$1M per breach',
          },
          {
            type: 'suspension',
            description: 'Market suspension for breaches',
          },
        ],
        effectiveDate: new Date('2005-07-01'),
        status: 'active',
        lastUpdated: new Date(),
      },
    ];

    sampleRegulations.forEach(regulation => {
      this.regulations.set(regulation.id, regulation);
    });

    this.logger.log(`Initialized ${sampleRegulations.length} international compliance regulations`);
  }

  private startComplianceMonitoring(): void {
    setInterval(() => {
      this.checkComplianceDeadlines();
      this.runAutomatedChecks();
      this.generateComplianceAlerts();
    }, 60000); // Every minute

    this.logger.log('Started international compliance monitoring');
  }

  private checkComplianceDeadlines(): void {
    const now = new Date();
    const upcomingDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    this.checks.forEach(check => {
      if (check.nextCheckDate <= upcomingDeadline && check.status === 'pending') {
        this.createAlert({
          entityId: check.entityId,
          entityType: check.entityType,
          regulationId: check.regulationId,
          type: 'deadline',
          severity: 'medium',
          message: `Compliance check due on ${check.nextCheckDate.toISOString()}`,
          details: {
            checkId: check.id,
            dueDate: check.nextCheckDate,
            regulation: this.regulations.get(check.regulationId)?.name,
          },
        });
      }
    });
  }

  private runAutomatedChecks(): void {
    // Simulate automated compliance checks
    const entities = ['grid_US_NERC', 'market_EU_EUETS', 'flow_CN_IN', 'facility_JP_TEPCO'];
    
    entities.forEach(entityId => {
      const [type, countryCode] = entityId.split('_');
      this.performComplianceCheck(entityId, type as any, countryCode);
    });
  }

  private performComplianceCheck(
    entityId: string,
    entityType: string,
    countryCode: string
  ): void {
    const applicableRegulations = Array.from(this.regulations.values())
      .filter(reg => 
        reg.countryCode === countryCode && 
        reg.status === 'active'
      );

    applicableRegulations.forEach(regulation => {
      const existingCheck = Array.from(this.checks.values())
        .find(check => 
          check.entityId === entityId && 
          check.regulationId === regulation.id
        );

      if (!existingCheck || existingCheck.nextCheckDate <= new Date()) {
        const check = this.generateComplianceCheck(entityId, entityType, regulation);
        this.checks.set(check.id, check);
        
        if (check.status === 'non_compliant') {
          this.createAlert({
            entityId,
            entityType,
            regulationId: regulation.id,
            type: 'violation',
            severity: check.findings.some(f => f.severity === 'critical') ? 'critical' : 'high',
            message: `Compliance violation detected for ${regulation.name}`,
            details: {
              checkId: check.id,
              score: check.score,
              findings: check.findings,
            },
          });
        }
      }
    });
  }

  private generateComplianceCheck(
    entityId: string,
    entityType: string,
    regulation: ComplianceRegulation
  ): ComplianceCheck {
    const score = Math.random() * 40 + 60; // 60-100 score
    const status = score >= 80 ? 'compliant' : score >= 60 ? 'pending' : 'non_compliant';
    
    const findings = [];
    if (status === 'non_compliant') {
      const findingCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < findingCount; i++) {
        findings.push({
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          category: 'operational',
          description: `Compliance issue #${i + 1} for ${regulation.name}`,
          recommendation: 'Immediate corrective action required',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }
    }

    return {
      id: `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityId,
      entityType: entityType as any,
      regulationId: regulation.id,
      status,
      score,
      findings,
      checkedAt: new Date(),
      nextCheckDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      checkedBy: 'automated_system',
    };
  }

  private generateComplianceAlerts(): void {
    // Check for patterns that might indicate systemic issues
    const recentChecks = Array.from(this.checks.values())
      .filter(check => check.checkedAt >= new Date(Date.now() - 24 * 60 * 60 * 1000));

    const nonCompliantByRegulation = recentChecks
      .filter(check => check.status === 'non_compliant')
      .reduce((acc: Record<string, number>, check) => {
        acc[check.regulationId] = (acc[check.regulationId] || 0) + 1;
        return acc;
      }, {});

    Object.entries(nonCompliantByRegulation).forEach(([regulationId, count]) => {
      if (count >= 3) {
        const regulation = this.regulations.get(regulationId);
        if (regulation) {
          this.createAlert({
            entityId: 'system',
            entityType: 'system',
            regulationId,
            type: 'audit',
            severity: 'high',
            message: `Systemic compliance issues detected for ${regulation.name}`,
            details: {
              violationCount: count,
              timeWindow: '24 hours',
            },
          });
        }
      }
    });
  }

  private createAlert(alertData: Partial<ComplianceAlert>): void {
    const alert: ComplianceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      resolved: false,
      ...alertData,
    } as ComplianceAlert;

    this.alerts.push(alert);
    this.logger.warn(`Compliance alert created: ${alert.type} for ${alert.entityId}`);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  async getAllRegulations(): Promise<ComplianceRegulation[]> {
    return Array.from(this.regulations.values());
  }

  async getRegulationById(regulationId: string): Promise<ComplianceRegulation | null> {
    return this.regulations.get(regulationId) || null;
  }

  async getRegulationsByCountry(countryCode: string): Promise<ComplianceRegulation[]> {
    return Array.from(this.regulations.values()).filter(regulation => 
      regulation.countryCode === countryCode
    );
  }

  async getActiveRegulations(): Promise<ComplianceRegulation[]> {
    return Array.from(this.regulations.values()).filter(regulation => 
      regulation.status === 'active'
    );
  }

  async getAllChecks(): Promise<ComplianceCheck[]> {
    return Array.from(this.checks.values());
  }

  async getChecksByEntity(entityId: string): Promise<ComplianceCheck[]> {
    return Array.from(this.checks.values()).filter(check => 
      check.entityId === entityId
    );
  }

  async getChecksByRegulation(regulationId: string): Promise<ComplianceCheck[]> {
    return Array.from(this.checks.values()).filter(check => 
      check.regulationId === regulationId
    );
  }

  async getNonCompliantChecks(): Promise<ComplianceCheck[]> {
    return Array.from(this.checks.values()).filter(check => 
      check.status === 'non_compliant'
    );
  }

  async performManualCheck(checkData: Partial<ComplianceCheck>): Promise<ComplianceCheck> {
    const check: ComplianceCheck = {
      id: `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityId: checkData.entityId || '',
      entityType: checkData.entityType || 'grid',
      regulationId: checkData.regulationId || '',
      status: 'pending',
      score: 0,
      findings: [],
      checkedAt: new Date(),
      nextCheckDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      checkedBy: 'manual',
      ...checkData,
    };

    this.checks.set(check.id, check);
    this.logger.log(`Manual compliance check initiated: ${check.id}`);
    return check;
  }

  async updateCheck(checkId: string, updateData: Partial<ComplianceCheck>): Promise<boolean> {
    const check = this.checks.get(checkId);
    if (!check) {
      return false;
    }

    Object.assign(check, updateData);
    this.checks.set(checkId, check);
    this.logger.log(`Updated compliance check: ${checkId}`);
    return true;
  }

  async generateReport(reportData: Partial<ComplianceReport>): Promise<ComplianceReport> {
    const report: ComplianceReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: reportData.title || 'Compliance Report',
      type: reportData.type || 'monthly',
      jurisdiction: reportData.jurisdiction || '',
      countryCode: reportData.countryCode || '',
      period: reportData.period || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      summary: this.calculateReportSummary(reportData.countryCode || '', reportData.period),
      recommendations: this.generateRecommendations(reportData.countryCode || ''),
      actionItems: [],
      generatedAt: new Date(),
      ...reportData,
    };

    this.reports.set(report.id, report);
    this.logger.log(`Generated compliance report: ${report.id}`);
    return report;
  }

  private calculateReportSummary(countryCode: string, period?: any): any {
    const periodStart = period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodEnd = period?.end || new Date();

    const periodChecks = Array.from(this.checks.values())
      .filter(check => 
        check.checkedAt >= periodStart && 
        check.checkedAt <= periodEnd &&
        (countryCode === '' || this.regulations.get(check.regulationId)?.countryCode === countryCode)
      );

    return {
      totalChecks: periodChecks.length,
      compliantChecks: periodChecks.filter(check => check.status === 'compliant').length,
      nonCompliantChecks: periodChecks.filter(check => check.status === 'non_compliant').length,
      pendingChecks: periodChecks.filter(check => check.status === 'pending').length,
      averageScore: periodChecks.length > 0 
        ? periodChecks.reduce((sum, check) => sum + check.score, 0) / periodChecks.length 
        : 0,
      criticalFindings: periodChecks.reduce((sum, check) => 
        sum + check.findings.filter(f => f.severity === 'critical').length, 0),
    };
  }

  private generateRecommendations(countryCode: string): string[] {
    const recommendations = [];
    
    const nonCompliantChecks = Array.from(this.checks.values())
      .filter(check => 
        check.status === 'non_compliant' &&
        (countryCode === '' || this.regulations.get(check.regulationId)?.countryCode === countryCode)
      );

    if (nonCompliantChecks.length > 0) {
      recommendations.push('Address all non-compliance findings immediately');
      recommendations.push('Implement preventive measures to avoid future violations');
    }

    const criticalFindings = nonCompliantChecks.reduce((sum, check) => 
      sum + check.findings.filter(f => f.severity === 'critical').length, 0);

    if (criticalFindings > 0) {
      recommendations.push('Critical findings require immediate management attention');
    }

    recommendations.push('Schedule regular compliance training for staff');
    recommendations.push('Update compliance procedures based on latest regulations');

    return recommendations;
  }

  async getReportsByCountry(countryCode: string): Promise<ComplianceReport[]> {
    return Array.from(this.reports.values()).filter(report => 
      report.countryCode === countryCode
    );
  }

  async getActiveAlerts(severity?: string): Promise<ComplianceAlert[]> {
    let alerts = this.alerts.filter(alert => !alert.resolved);
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      alert.resolvedBy = resolvedBy;
      this.logger.log(`Alert ${alertId} resolved by ${resolvedBy}`);
      return true;
    }
    return false;
  }

  async getComplianceMetrics(): Promise<ComplianceMetrics> {
    const regulations = Array.from(this.regulations.values());
    const activeRegulations = regulations.filter(reg => reg.status === 'active');
    const checks = Array.from(this.checks.values());
    const compliantChecks = checks.filter(check => check.status === 'compliant');

    const regionalCompliance: Record<string, any> = {};
    const countries = [...new Set(activeRegulations.map(reg => reg.countryCode))];

    countries.forEach(countryCode => {
      const countryRegulations = activeRegulations.filter(reg => reg.countryCode === countryCode);
      const countryChecks = checks.filter(check => 
        this.regulations.get(check.regulationId)?.countryCode === countryCode
      );
      const countryCompliant = countryChecks.filter(check => check.status === 'compliant');

      regionalCompliance[countryCode] = {
        regulations: countryRegulations.length,
        compliance: countryChecks.length > 0 ? countryCompliant.length / countryChecks.length : 0,
        score: countryChecks.length > 0 
          ? countryChecks.reduce((sum, check) => sum + check.score, 0) / countryChecks.length 
          : 0,
      };
    });

    return {
      totalRegulations: regulations.length,
      activeRegulations: activeRegulations.length,
      totalChecks: checks.length,
      compliantRate: checks.length > 0 ? compliantChecks.length / checks.length : 0,
      averageScore: checks.length > 0 
        ? checks.reduce((sum, check) => sum + check.score, 0) / checks.length 
        : 0,
      criticalViolations: checks.reduce((sum, check) => 
        sum + check.findings.filter(f => f.severity === 'critical').length, 0),
      overdueChecks: checks.filter(check => check.nextCheckDate < new Date()).length,
      upcomingDeadlines: checks.filter(check => 
        check.nextCheckDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
        check.status === 'pending'
      ).length,
      regionalCompliance,
    };
  }

  async addRegulation(regulationData: Partial<ComplianceRegulation>): Promise<ComplianceRegulation> {
    const regulation: ComplianceRegulation = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: regulationData.name || 'New Regulation',
      type: regulationData.type || 'grid',
      jurisdiction: regulationData.jurisdiction || '',
      countryCode: regulationData.countryCode || '',
      region: regulationData.region || '',
      description: regulationData.description || '',
      requirements: regulationData.requirements || [],
      penalties: regulationData.penalties || [],
      effectiveDate: regulationData.effectiveDate || new Date(),
      status: regulationData.status || 'active',
      lastUpdated: new Date(),
      ...regulationData,
    };

    this.regulations.set(regulation.id, regulation);
    this.logger.log(`Added new compliance regulation: ${regulation.id}`);
    return regulation;
  }

  async updateRegulation(regulationId: string, updateData: Partial<ComplianceRegulation>): Promise<boolean> {
    const regulation = this.regulations.get(regulationId);
    if (!regulation) {
      return false;
    }

    Object.assign(regulation, updateData, { lastUpdated: new Date() });
    this.regulations.set(regulationId, regulation);
    this.logger.log(`Updated compliance regulation: ${regulationId}`);
    return true;
  }

  async getComplianceStatus(entityId: string): Promise<{
    overallStatus: 'compliant' | 'non_compliant' | 'pending';
    score: number;
    regulations: Array<{
      regulationId: string;
      regulationName: string;
      status: string;
      score: number;
      lastChecked: Date;
    }>;
    criticalIssues: number;
    upcomingDeadlines: number;
  }> {
    const entityChecks = Array.from(this.checks.values())
      .filter(check => check.entityId === entityId);

    if (entityChecks.length === 0) {
      return {
        overallStatus: 'pending',
        score: 0,
        regulations: [],
        criticalIssues: 0,
        upcomingDeadlines: 0,
      };
    }

    const averageScore = entityChecks.reduce((sum, check) => sum + check.score, 0) / entityChecks.length;
    const hasNonCompliant = entityChecks.some(check => check.status === 'non_compliant');
    const hasPending = entityChecks.some(check => check.status === 'pending');

    const overallStatus = hasNonCompliant ? 'non_compliant' : hasPending ? 'pending' : 'compliant';

    const regulations = entityChecks.map(check => ({
      regulationId: check.regulationId,
      regulationName: this.regulations.get(check.regulationId)?.name || 'Unknown',
      status: check.status,
      score: check.score,
      lastChecked: check.checkedAt,
    }));

    const criticalIssues = entityChecks.reduce((sum, check) => 
      sum + check.findings.filter(f => f.severity === 'critical').length, 0);

    const upcomingDeadlines = entityChecks.filter(check => 
      check.nextCheckDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
      check.status === 'pending'
    ).length;

    return {
      overallStatus,
      score: averageScore,
      regulations,
      criticalIssues,
      upcomingDeadlines,
    };
  }
}
