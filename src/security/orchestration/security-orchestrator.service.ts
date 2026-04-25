import { Injectable, Logger } from '@nestjs/common';
import { ThreatIntelligenceService } from '../threat-intel/threat-intelligence.service';

@Injectable()
export class SecurityOrchestratorService {
  private readonly logger = new Logger(SecurityOrchestratorService.name);

  constructor(private readonly threatIntel: ThreatIntelligenceService) {}

  async handleThreat(threat: { type: string; source: string; severity: 'LOW' | 'HIGH' | 'CRITICAL' }) {
    this.logger.error(`Handling threat: ${threat.type} from ${threat.source}`);

    if (threat.severity === 'CRITICAL' || threat.severity === 'HIGH') {
      this.threatIntel.updateIntelligence([threat.source]);
      this.logger.log(`Source ${threat.source} has been blacklisted automatically`);
    }

    // Trigger other automated responses (e.g. notify admins, isolate systems)
  }
}
