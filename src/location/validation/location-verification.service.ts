import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeolocationData } from '../geolocation/ip-geolocation.service';

export interface VerificationMethod {
  id: string;
  name: string;
  type: 'ip' | 'gps' | 'wifi' | 'cell' | 'document' | 'biometric';
  accuracy: number;
  reliability: number;
  enabled: boolean;
  priority: number;
}

export interface LocationVerificationRequest {
  userId: string;
  claimedLocation: {
    country: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  verificationMethods: string[];
  context: {
    ipAddress: string;
    userAgent: string;
    deviceId?: string;
    timestamp: Date;
  };
}

export interface VerificationResult {
  success: boolean;
  confidence: number;
  verifiedLocation?: GeolocationData;
  methods: {
    [methodId: string]: {
      success: boolean;
      confidence: number;
      data: any;
      issues: string[];
    };
  };
  riskScore: number;
  riskFactors: string[];
  recommendations: string[];
  timestamp: Date;
}

export interface SpoofingDetection {
  isSpoofed: boolean;
  confidence: number;
  indicators: string[];
  evidence: Record<string, any>;
  recommendedAction: 'allow' | 'challenge' | 'block';
}

@Injectable()
export class LocationVerificationService {
  private readonly logger = new Logger(LocationVerificationService.name);
  private verificationMethods: Map<string, VerificationMethod> = new Map();
  private verificationHistory: Map<string, VerificationResult[]> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeVerificationMethods();
  }

  private initializeVerificationMethods(): void {
    const methods: VerificationMethod[] = [
      {
        id: 'ip_geolocation',
        name: 'IP Geolocation',
        type: 'ip',
        accuracy: 0.95,
        reliability: 0.90,
        enabled: true,
        priority: 1,
      },
      {
        id: 'gps_coordinates',
        name: 'GPS Coordinates',
        type: 'gps',
        accuracy: 0.99,
        reliability: 0.95,
        enabled: true,
        priority: 2,
      },
      {
        id: 'wifi_positioning',
        name: 'WiFi Positioning',
        type: 'wifi',
        accuracy: 0.85,
        reliability: 0.80,
        enabled: true,
        priority: 3,
      },
      {
        id: 'cell_tower',
        name: 'Cell Tower Triangulation',
        type: 'cell',
        accuracy: 0.75,
        reliability: 0.70,
        enabled: true,
        priority: 4,
      },
      {
        id: 'document_verification',
        name: 'Document Verification',
        type: 'document',
        accuracy: 0.98,
        reliability: 0.95,
        enabled: true,
        priority: 5,
      },
      {
        id: 'biometric_location',
        name: 'Biometric Location Check',
        type: 'biometric',
        accuracy: 0.92,
        reliability: 0.88,
        enabled: false, // Requires additional setup
        priority: 6,
      },
    ];

    methods.forEach(method => {
      this.verificationMethods.set(method.id, method);
    });
  }

  async verifyLocation(request: LocationVerificationRequest): Promise<VerificationResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting location verification for user ${request.userId}`);
      
      const results: VerificationResult = {
        success: false,
        confidence: 0,
        methods: {},
        riskScore: 0,
        riskFactors: [],
        recommendations: [],
        timestamp: new Date(),
      };

      let totalConfidence = 0;
      let methodCount = 0;
      let successfulMethods = 0;

      for (const methodId of request.verificationMethods) {
        const method = this.verificationMethods.get(methodId);
        if (!method || !method.enabled) {
          continue;
        }

        try {
          const methodResult = await this.performVerification(method, request);
          results.methods[methodId] = methodResult;
          
          if (methodResult.success) {
            successfulMethods++;
            totalConfidence += methodResult.confidence;
          }
          
          methodCount++;
        } catch (error) {
          this.logger.warn(`Verification method ${methodId} failed: ${error.message}`);
          results.methods[methodId] = {
            success: false,
            confidence: 0,
            data: null,
            issues: [error.message],
          };
        }
      }

      if (methodCount > 0) {
        results.confidence = totalConfidence / methodCount;
        results.success = successfulMethods >= Math.ceil(methodCount / 2);
      }

      // Perform spoofing detection
      const spoofingResult = await this.detectSpoofing(request, results);
      results.riskScore = spoofingResult.confidence;
      results.riskFactors = spoofingResult.indicators;

      if (spoofingResult.isSpoofed) {
        results.success = false;
        results.recommendations.push(this.getRecommendedAction(spoofingResult.recommendedAction));
      }

      // Store verification history
      await this.storeVerificationHistory(request.userId, results);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Location verification completed in ${processingTime}ms with confidence ${results.confidence}`);

      return results;
    } catch (error) {
      this.logger.error(`Location verification error: ${error.message}`);
      return {
        success: false,
        confidence: 0,
        methods: {},
        riskScore: 1.0,
        riskFactors: ['system_error'],
        recommendations: ['retry_verification'],
        timestamp: new Date(),
      };
    }
  }

  private async performVerification(
    method: VerificationMethod,
    request: LocationVerificationRequest,
  ): Promise<{ success: boolean; confidence: number; data: any; issues: string[] }> {
    switch (method.type) {
      case 'ip':
        return this.verifyIpLocation(request);
      case 'gps':
        return this.verifyGpsLocation(request);
      case 'wifi':
        return this.verifyWifiLocation(request);
      case 'cell':
        return this.verifyCellLocation(request);
      case 'document':
        return this.verifyDocumentLocation(request);
      case 'biometric':
        return this.verifyBiometricLocation(request);
      default:
        throw new Error(`Unknown verification method type: ${method.type}`);
    }
  }

  private async verifyIpLocation(request: LocationVerificationRequest): Promise<any> {
    try {
      // Simulate IP geolocation verification
      const ipData = await this.getIpGeolocation(request.context.ipAddress);
      
      if (!ipData.success) {
        return {
          success: false,
          confidence: 0,
          data: null,
          issues: ['ip_geolocation_failed'],
        };
      }

      const countryMatch = ipData.data.country === request.claimedLocation.country;
      const cityMatch = !request.claimedLocation.city || 
                       ipData.data.city.toLowerCase() === request.claimedLocation.city.toLowerCase();

      const confidence = countryMatch ? (cityMatch ? 0.95 : 0.80) : 0.30;

      return {
        success: countryMatch,
        confidence,
        data: ipData.data,
        issues: countryMatch ? [] : ['country_mismatch'],
      };
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        data: null,
        issues: [error.message],
      };
    }
  }

  private async verifyGpsLocation(request: LocationVerificationRequest): Promise<any> {
    if (!request.claimedLocation.coordinates) {
      return {
        success: false,
        confidence: 0,
        data: null,
        issues: ['no_gps_coordinates'],
      };
    }

    try {
      // Simulate GPS verification
      const gpsVerification = await this.verifyGpsCoordinates(
        request.claimedLocation.coordinates,
        request.claimedLocation.country,
      );

      return {
        success: gpsVerification.valid,
        confidence: gpsVerification.confidence,
        data: gpsVerification.data,
        issues: gpsVerification.valid ? [] : gpsVerification.issues,
      };
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        data: null,
        issues: [error.message],
      };
    }
  }

  private async verifyWifiLocation(request: LocationVerificationRequest): Promise<any> {
    // Simulate WiFi positioning verification
    return {
      success: Math.random() > 0.3,
      confidence: 0.85,
      data: {
        wifiNetworks: Math.floor(Math.random() * 10) + 1,
        signalStrength: Math.random() * 100,
        accuracy: Math.random() * 50 + 10, // 10-60 meters
      },
      issues: [],
    };
  }

  private async verifyCellLocation(request: LocationVerificationRequest): Promise<any> {
    // Simulate cell tower verification
    return {
      success: Math.random() > 0.4,
      confidence: 0.75,
      data: {
        cellTowers: Math.floor(Math.random() * 5) + 1,
        signalStrength: Math.random() * 100,
        accuracy: Math.random() * 1000 + 100, // 100-1100 meters
      },
      issues: [],
    };
  }

  private async verifyDocumentLocation(request: LocationVerificationRequest): Promise<any> {
    // Simulate document verification
    return {
      success: Math.random() > 0.1,
      confidence: 0.98,
      data: {
        documentType: 'passport',
        issuingCountry: request.claimedLocation.country,
        verificationStatus: 'verified',
        expiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000 * 5),
      },
      issues: [],
    };
  }

  private async verifyBiometricLocation(request: LocationVerificationRequest): Promise<any> {
    // Simulate biometric verification
    return {
      success: Math.random() > 0.2,
      confidence: 0.92,
      data: {
        biometricType: 'facial_recognition',
        matchScore: Math.random() * 0.3 + 0.7,
        livenessCheck: Math.random() > 0.1,
      },
      issues: [],
    };
  }

  private async detectSpoofing(
    request: LocationVerificationRequest,
    verificationResult: VerificationResult,
  ): Promise<SpoofingDetection> {
    const indicators: string[] = [];
    let spoofingConfidence = 0;
    const evidence: Record<string, any> = {};

    // Check for VPN/Proxy usage
    if (await this.isVpnOrProxy(request.context.ipAddress)) {
      indicators.push('vpn_or_proxy_detected');
      spoofingConfidence += 0.3;
      evidence.vpnDetected = true;
    }

    // Check for inconsistent location data
    const locationConsistency = this.checkLocationConsistency(verificationResult);
    if (!locationConsistency.consistent) {
      indicators.push('location_inconsistency');
      spoofingConfidence += locationConsistency.discrepancy * 0.4;
      evidence.locationInconsistency = locationConsistency;
    }

    // Check for impossible travel speeds
    const travelAnalysis = await this.analyzeTravelPatterns(request.userId, request.claimedLocation);
    if (travelAnalysis.impossibleSpeed) {
      indicators.push('impossible_travel_speed');
      spoofingConfidence += 0.5;
      evidence.impossibleTravel = travelAnalysis;
    }

    // Check for suspicious IP patterns
    const ipAnalysis = await this.analyzeIpPatterns(request.context.ipAddress);
    if (ipAnalysis.suspicious) {
      indicators.push('suspicious_ip_pattern');
      spoofingConfidence += 0.2;
      evidence.ipAnalysis = ipAnalysis;
    }

    // Check for device fingerprint anomalies
    const deviceAnalysis = await this.analyzeDeviceFingerprint(request);
    if (deviceAnalysis.anomalous) {
      indicators.push('device_fingerprint_anomaly');
      spoofingConfidence += 0.15;
      evidence.deviceAnalysis = deviceAnalysis;
    }

    const isSpoofed = spoofingConfidence > 0.5;
    const recommendedAction = this.getRecommendedAction(
      isSpoofed ? (spoofingConfidence > 0.8 ? 'block' : 'challenge') : 'allow'
    );

    return {
      isSpoofed,
      confidence: Math.min(spoofingConfidence, 1.0),
      indicators,
      evidence,
      recommendedAction,
    };
  }

  private async isVpnOrProxy(ipAddress: string): Promise<boolean> {
    // Simulate VPN/Proxy detection
    const vpnIpRanges = [
      '10.0.0.', '172.16.', '192.168.', // Private ranges
      '100.64.', '100.65.', '100.66.', // CGNAT ranges
    ];
    
    return vpnIpRanges.some(range => ipAddress.startsWith(range)) || Math.random() > 0.9;
  }

  private checkLocationConsistency(verificationResult: VerificationResult): {
    consistent: boolean;
    discrepancy: number;
  } {
    const successfulMethods = Object.entries(verificationResult.methods)
      .filter(([_, result]) => result.success);

    if (successfulMethods.length < 2) {
      return { consistent: true, discrepancy: 0 };
    }

    // Simulate consistency check
    const discrepancy = Math.random() * 0.5;
    return {
      consistent: discrepancy < 0.2,
      discrepancy,
    };
  }

  private async analyzeTravelPatterns(userId: string, claimedLocation: any): Promise<{
    impossibleSpeed: boolean;
    speed?: number;
    distance?: number;
    timeDiff?: number;
  }> {
    // Simulate travel pattern analysis
    const previousVerifications = this.verificationHistory.get(userId) || [];
    
    if (previousVerifications.length === 0) {
      return { impossibleSpeed: false };
    }

    const lastVerification = previousVerifications[previousVerifications.length - 1];
    const timeDiff = Date.now() - lastVerification.timestamp.getTime();
    const distance = Math.random() * 10000; // Simulate distance in km
    const speed = distance / (timeDiff / (1000 * 60 * 60)); // km/h

    return {
      impossibleSpeed: speed > 1000, // Commercial aircraft speed
      speed,
      distance,
      timeDiff,
    };
  }

  private async analyzeIpPatterns(ipAddress: string): Promise<{
    suspicious: boolean;
    reasons: string[];
  }> {
    // Simulate IP pattern analysis
    const reasons: string[] = [];
    let suspicious = false;

    if (Math.random() > 0.95) {
      reasons.push('known_malicious_ip');
      suspicious = true;
    }

    if (Math.random() > 0.9) {
      reasons.push('datacenter_ip');
      suspicious = true;
    }

    return { suspicious, reasons };
  }

  private async analyzeDeviceFingerprint(request: LocationVerificationRequest): Promise<{
    anomalous: boolean;
    anomalies: string[];
  }> {
    // Simulate device fingerprint analysis
    const anomalies: string[] = [];
    let anomalous = false;

    if (Math.random() > 0.9) {
      anomalies.push('user_agent_inconsistency');
      anomalous = true;
    }

    return { anomalous, anomalies };
  }

  private getRecommendedAction(action: 'allow' | 'challenge' | 'block'): 'allow' | 'challenge' | 'block' {
    return action;
  }

  private async storeVerificationHistory(userId: string, result: VerificationResult): Promise<void> {
    const history = this.verificationHistory.get(userId) || [];
    history.push(result);
    
    // Keep only last 50 verifications
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    this.verificationHistory.set(userId, history);
  }

  async getVerificationHistory(userId: string, limit: number = 10): Promise<VerificationResult[]> {
    const history = this.verificationHistory.get(userId) || [];
    return history.slice(-limit).reverse();
  }

  async getVerificationMethods(): Promise<VerificationMethod[]> {
    return Array.from(this.verificationMethods.values());
  }

  async updateVerificationMethod(methodId: string, updates: Partial<VerificationMethod>): Promise<boolean> {
    const method = this.verificationMethods.get(methodId);
    if (!method) {
      return false;
    }

    this.verificationMethods.set(methodId, { ...method, ...updates });
    this.logger.log(`Updated verification method: ${methodId}`);
    return true;
  }

  async getVerificationStatistics(): Promise<{
    totalVerifications: number;
    successfulVerifications: number;
    averageConfidence: number;
    spoofingAttemptsBlocked: number;
    methodUsage: Record<string, number>;
  }> {
    const allVerifications = Array.from(this.verificationHistory.values()).flat();
    const successful = allVerifications.filter(v => v.success).length;
    const spoofingBlocked = allVerifications.filter(v => v.riskScore > 0.8).length;

    const methodUsage: Record<string, number> = {};
    allVerifications.forEach(verification => {
      Object.keys(verification.methods).forEach(methodId => {
        methodUsage[methodId] = (methodUsage[methodId] || 0) + 1;
      });
    });

    return {
      totalVerifications: allVerifications.length,
      successfulVerifications: successful,
      averageConfidence: allVerifications.length > 0 
        ? allVerifications.reduce((sum, v) => sum + v.confidence, 0) / allVerifications.length 
        : 0,
      spoofingAttemptsBlocked: spoofingBlocked,
      methodUsage,
    };
  }

  private async getIpGeolocation(ipAddress: string): Promise<{ success: boolean; data: any }> {
    // Simulate IP geolocation - in real implementation, would use actual geolocation service
    return {
      success: true,
      data: {
        ip: ipAddress,
        country: 'United States',
        countryCode: 'US',
        city: 'New York',
        region: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
        timezone: 'America/New_York',
        isp: 'Example ISP',
        accuracy: 0.95,
      },
    };
  }

  private async verifyGpsCoordinates(
    coordinates: { latitude: number; longitude: number },
    claimedCountry: string,
  ): Promise<{ valid: boolean; confidence: number; data: any; issues: string[] }> {
    // Simulate GPS coordinate verification
    const validLat = coordinates.latitude >= -90 && coordinates.latitude <= 90;
    const validLon = coordinates.longitude >= -180 && coordinates.longitude <= 180;

    return {
      valid: validLat && validLon,
      confidence: validLat && validLon ? 0.99 : 0.1,
      data: {
        coordinates,
        accuracy: Math.random() * 10 + 1, // 1-11 meters
        satelliteCount: Math.floor(Math.random() * 12) + 4,
      },
      issues: validLat && validLon ? [] : ['invalid_coordinates'],
    };
  }
}
