import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ThreatIntelligenceService } from '../threat-intel/threat-intelligence.service';

@Injectable()
export class ZeroTrustService {
  constructor(private readonly threatIntel: ThreatIntelligenceService) {}

  async validateRequest(context: { ip: string; token: string; deviceId: string }): Promise<boolean> {
    // 1. Check IP against threat intel
    if (this.threatIntel.isMalicious(context.ip)) {
      throw new UnauthorizedException('Request from malicious IP blocked');
    }

    // 2. Validate token (Mock)
    if (!context.token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    // 3. Device verification (Mock)
    if (!context.deviceId) {
      throw new UnauthorizedException('Unrecognized device');
    }

    return true;
  }
}
