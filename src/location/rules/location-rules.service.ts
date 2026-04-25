import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeolocationData } from '../geolocation/ip-geolocation.service';

export interface TradingRule {
  id: string;
  name: string;
  type: 'restriction' | 'requirement' | 'limitation';
  scope: 'country' | 'region' | 'city';
  target: string;
  condition: string;
  action: 'block' | 'allow' | 'limit' | 'verify';
  parameters: Record<string, any>;
  priority: number;
  active: boolean;
}

export interface TradingRuleResult {
  allowed: boolean;
  blocked: boolean;
  limited: boolean;
  requiresVerification: boolean;
  rules: string[];
  limitations: Record<string, any>;
  warnings: string[];
}

export interface RegionalPricing {
  region: string;
  currency: string;
  basePrice: number;
  adjustedPrice: number;
  discount: number;
  surcharge: number;
  marketConditions: string[];
}

@Injectable()
export class LocationRulesService {
  private readonly logger = new Logger(LocationRulesService.name);
  private tradingRules: Map<string, TradingRule[]> = new Map();
  private regionalPricing: Map<string, RegionalPricing> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeRules();
    this.initializeRegionalPricing();
  }

  private initializeRules(): void {
    const defaultRules: TradingRule[] = [
      {
        id: 'US_SANCTIONS',
        name: 'US Sanctions Compliance',
        type: 'restriction',
        scope: 'country',
        target: 'US',
        condition: 'countryCode == "US"',
        action: 'verify',
        parameters: { requireKyc: true, maxTransaction: 10000 },
        priority: 1,
        active: true,
      },
      {
        id: 'EU_GDPR',
        name: 'EU GDPR Compliance',
        type: 'requirement',
        scope: 'country',
        target: 'EU',
        condition: 'countryCode in ["DE","FR","IT","ES","NL","BE","AT"]',
        action: 'verify',
        parameters: { consentRequired: true, dataRetention: 30 },
        priority: 2,
        active: true,
      },
      {
        id: 'CN_RESTRICTIONS',
        name: 'China Trading Restrictions',
        type: 'restriction',
        scope: 'country',
        target: 'CN',
        condition: 'countryCode == "CN"',
        action: 'block',
        parameters: { reason: 'regulatory_compliance' },
        priority: 1,
        active: true,
      },
      {
        id: 'HIGH_RISK_REGIONS',
        name: 'High Risk Regions',
        type: 'restriction',
        scope: 'country',
        target: 'HIGH_RISK',
        condition: 'countryCode in ["IR","KP","SY","MM"]',
        action: 'block',
        parameters: { reason: 'high_risk_jurisdiction' },
        priority: 1,
        active: true,
      },
      {
        id: 'LIMITED_JURISDICTIONS',
        name: 'Limited Trading Jurisdictions',
        type: 'limitation',
        scope: 'country',
        target: 'LIMITED',
        condition: 'countryCode in ["RU","IN","BR","ZA"]',
        action: 'limit',
        parameters: { maxDailyVolume: 50000, maxTransaction: 5000 },
        priority: 3,
        active: true,
      },
    ];

    this.tradingRules.set('default', defaultRules);
  }

  private initializeRegionalPricing(): void {
    const pricingData: RegionalPricing[] = [
      {
        region: 'US',
        currency: 'USD',
        basePrice: 100,
        adjustedPrice: 100,
        discount: 0,
        surcharge: 0,
        marketConditions: ['stable', 'high_liquidity'],
      },
      {
        region: 'EU',
        currency: 'EUR',
        basePrice: 100,
        adjustedPrice: 95,
        discount: 5,
        surcharge: 0,
        marketConditions: ['regulated', 'moderate_liquidity'],
      },
      {
        region: 'APAC',
        currency: 'USD',
        basePrice: 100,
        adjustedPrice: 105,
        discount: 0,
        surcharge: 5,
        marketConditions: ['emerging', 'variable_liquidity'],
      },
      {
        region: 'LATAM',
        currency: 'USD',
        basePrice: 100,
        adjustedPrice: 110,
        discount: 0,
        surcharge: 10,
        marketConditions: ['high_volatility', 'limited_liquidity'],
      },
    ];

    pricingData.forEach(pricing => {
      this.regionalPricing.set(pricing.region, pricing);
    });
  }

  async evaluateTradingRules(
    location: GeolocationData,
    userId?: string,
    transactionAmount?: number,
  ): Promise<TradingRuleResult> {
    const startTime = Date.now();
    
    try {
      const applicableRules = await this.getApplicableRules(location);
      const result: TradingRuleResult = {
        allowed: true,
        blocked: false,
        limited: false,
        requiresVerification: false,
        rules: [],
        limitations: {},
        warnings: [],
      };

      for (const rule of applicableRules) {
        if (!rule.active) continue;

        const ruleResult = await this.evaluateRule(rule, location, userId, transactionAmount);
        
        if (ruleResult.blocked) {
          result.blocked = true;
          result.allowed = false;
          result.rules.push(rule.id);
          result.warnings.push(`Trading blocked: ${rule.name}`);
          break;
        }

        if (ruleResult.requiresVerification) {
          result.requiresVerification = true;
          result.rules.push(rule.id);
          result.warnings.push(`Verification required: ${rule.name}`);
        }

        if (ruleResult.limited) {
          result.limited = true;
          result.rules.push(rule.id);
          Object.assign(result.limitations, ruleResult.limitations);
        }
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`Rule evaluation completed in ${processingTime}ms for ${location.countryCode}`);

      return result;
    } catch (error) {
      this.logger.error(`Error evaluating trading rules: ${error.message}`);
      return {
        allowed: false,
        blocked: true,
        limited: false,
        requiresVerification: false,
        rules: ['SYSTEM_ERROR'],
        limitations: {},
        warnings: ['System error during rule evaluation'],
      };
    }
  }

  private async getApplicableRules(location: GeolocationData): Promise<TradingRule[]> {
    const allRules = this.tradingRules.get('default') || [];
    
    return allRules.filter(rule => {
      switch (rule.scope) {
        case 'country':
          return this.evaluateCondition(rule.condition, {
            countryCode: location.countryCode,
            country: location.country,
          });
        case 'region':
          return this.evaluateCondition(rule.condition, {
            region: location.region,
            city: location.city,
          });
        case 'city':
          return this.evaluateCondition(rule.condition, {
            city: location.city,
          });
        default:
          return false;
      }
    }).sort((a, b) => a.priority - b.priority);
  }

  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    try {
      const sanitizedCondition = condition.replace(/[^a-zA-Z0-9_==<>()"'\s,]/g, '');
      const func = new Function(...Object.keys(context), `return ${sanitizedCondition}`);
      return func(...Object.values(context));
    } catch (error) {
      this.logger.warn(`Failed to evaluate condition: ${condition}`);
      return false;
    }
  }

  private async evaluateRule(
    rule: TradingRule,
    location: GeolocationData,
    userId?: string,
    transactionAmount?: number,
  ): Promise<Partial<TradingRuleResult>> {
    switch (rule.action) {
      case 'block':
        return { blocked: true, allowed: false };
      
      case 'verify':
        return { requiresVerification: true };
      
      case 'limit':
        const limitations = this.applyLimitations(rule.parameters, transactionAmount);
        return { limited: true, limitations };
      
      case 'allow':
      default:
        return { allowed: true };
    }
  }

  private applyLimitations(parameters: Record<string, any>, transactionAmount?: number): Record<string, any> {
    const limitations: Record<string, any> = {};

    if (parameters.maxTransaction && transactionAmount) {
      limitations.maxTransaction = parameters.maxTransaction;
      limitations.transactionAllowed = transactionAmount <= parameters.maxTransaction;
    }

    if (parameters.maxDailyVolume) {
      limitations.maxDailyVolume = parameters.maxDailyVolume;
    }

    if (parameters.requireKyc) {
      limitations.kycRequired = true;
    }

    return limitations;
  }

  async getRegionalPricing(location: GeolocationData): Promise<RegionalPricing | null> {
    const region = this.determineRegion(location.countryCode);
    return this.regionalPricing.get(region) || null;
  }

  private determineRegion(countryCode: string): string {
    const regionMapping: Record<string, string> = {
      'US': 'US',
      'CA': 'US',
      'MX': 'LATAM',
      'GB': 'EU',
      'DE': 'EU',
      'FR': 'EU',
      'IT': 'EU',
      'ES': 'EU',
      'NL': 'EU',
      'BE': 'EU',
      'AT': 'EU',
      'JP': 'APAC',
      'CN': 'APAC',
      'IN': 'APAC',
      'KR': 'APAC',
      'SG': 'APAC',
      'AU': 'APAC',
      'NZ': 'APAC',
      'BR': 'LATAM',
      'AR': 'LATAM',
      'CL': 'LATAM',
      'CO': 'LATAM',
      'PE': 'LATAM',
      'RU': 'APAC',
      'ZA': 'APAC',
      'EG': 'APAC',
      'NG': 'APAC',
      'KE': 'APAC',
    };

    return regionMapping[countryCode] || 'APAC';
  }

  async addCustomRule(rule: TradingRule): Promise<void> {
    const existingRules = this.tradingRules.get('default') || [];
    existingRules.push(rule);
    existingRules.sort((a, b) => a.priority - b.priority);
    this.tradingRules.set('default', existingRules);
    
    this.logger.log(`Added custom rule: ${rule.id}`);
  }

  async updateRule(ruleId: string, updates: Partial<TradingRule>): Promise<boolean> {
    const existingRules = this.tradingRules.get('default') || [];
    const ruleIndex = existingRules.findIndex(rule => rule.id === ruleId);
    
    if (ruleIndex === -1) {
      return false;
    }

    existingRules[ruleIndex] = { ...existingRules[ruleIndex], ...updates };
    this.tradingRules.set('default', existingRules);
    
    this.logger.log(`Updated rule: ${ruleId}`);
    return true;
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const existingRules = this.tradingRules.get('default') || [];
    const filteredRules = existingRules.filter(rule => rule.id !== ruleId);
    
    if (filteredRules.length === existingRules.length) {
      return false;
    }

    this.tradingRules.set('default', filteredRules);
    this.logger.log(`Deleted rule: ${ruleId}`);
    return true;
  }

  async getAllRules(): Promise<TradingRule[]> {
    return this.tradingRules.get('default') || [];
  }

  async isLocationAllowed(location: GeolocationData): Promise<boolean> {
    const result = await this.evaluateTradingRules(location);
    return result.allowed && !result.blocked;
  }

  async getLocationRestrictions(location: GeolocationData): Promise<string[]> {
    const result = await this.evaluateTradingRules(location);
    return result.warnings;
  }
}
