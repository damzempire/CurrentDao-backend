import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ThreatIntelligenceService {
  private readonly logger = new Logger(ThreatIntelligenceService.name);
  private readonly maliciousIps = new Set<string>();

  constructor() {
    // Initial known bad IPs
    this.maliciousIps.add('1.2.3.4');
    this.maliciousIps.add('8.8.8.4');
  }

  isMalicious(ip: string): boolean {
    return this.maliciousIps.has(ip);
  }

  updateIntelligence(newIps: string[]) {
    newIps.forEach(ip => this.maliciousIps.add(ip));
    this.logger.log(`Updated threat intelligence with ${newIps.length} new indicators`);
  }
}
