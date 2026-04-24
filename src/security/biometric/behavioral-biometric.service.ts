import { Injectable, Logger } from '@nestjs/common';

export interface InteractionPattern {
  typingSpeed: number;
  mouseMovementVariance: number;
  dwellTime: number;
}

@Injectable()
export class BehavioralBiometricService {
  private readonly logger = new Logger(BehavioralBiometricService.name);
  private readonly baselinePatterns = new Map<string, InteractionPattern>();

  registerPattern(userId: string, pattern: InteractionPattern) {
    this.baselinePatterns.set(userId, pattern);
  }

  validatePattern(userId: string, pattern: InteractionPattern): boolean {
    const baseline = this.baselinePatterns.get(userId);
    if (!baseline) return true; // Default to true if no baseline

    const speedDiff = Math.abs(baseline.typingSpeed - pattern.typingSpeed);
    const mouseDiff = Math.abs(baseline.mouseMovementVariance - pattern.mouseMovementVariance);

    // Thresholds for anomaly detection
    const isAnomaly = speedDiff > 50 || mouseDiff > 100;
    
    if (isAnomaly) {
      this.logger.warn(`Behavioral anomaly detected for user: ${userId}`);
    }

    return !isAnomaly;
  }
}
