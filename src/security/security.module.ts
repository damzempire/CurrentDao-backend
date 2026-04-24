import { Module } from '@nestjs/common';
import { AdvancedSecurityController } from './advanced-security.controller';
import { ZeroTrustService } from './zero-trust/zero-trust.service';
import { BehavioralBiometricService } from './biometric/behavioral-biometric.service';
import { QuantumEncryptionService } from './encryption/quantum-encryption.service';
import { SecurityOrchestratorService } from './orchestration/security-orchestrator.service';
import { ThreatIntelligenceService } from './threat-intel/threat-intelligence.service';
import { PenetrationTestingService } from './testing/penetration-testing.service';
import { ZeroKnowledgeService } from './zero-knowledge/zero-knowledge.service';

@Module({
  controllers: [AdvancedSecurityController],
  providers: [
    ZeroTrustService,
    BehavioralBiometricService,
    QuantumEncryptionService,
    SecurityOrchestratorService,
    ThreatIntelligenceService,
    PenetrationTestingService,
    ZeroKnowledgeService,
  ],
  exports: [
    ZeroTrustService,
    QuantumEncryptionService,
    ThreatIntelligenceService,
    ZeroKnowledgeService,
  ],
})
export class SecurityModule {}
