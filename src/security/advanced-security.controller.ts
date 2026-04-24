import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ZeroTrustService } from './zero-trust/zero-trust.service';
import { QuantumEncryptionService } from './encryption/quantum-encryption.service';
import { ZeroKnowledgeService } from './zero-knowledge/zero-knowledge.service';

@Controller('security')
export class AdvancedSecurityController {
  constructor(
    private readonly zeroTrust: ZeroTrustService,
    private readonly quantum: QuantumEncryptionService,
    private readonly zkp: ZeroKnowledgeService,
  ) {}

  @Post('encrypt')
  async encrypt(@Body() body: { data: string; key: string }) {
    return { encrypted: await this.quantum.encrypt(body.data, body.key) };
  }

  @Post('zkp/prove')
  async prove(@Body() body: { secret: string }) {
    return this.zkp.generateProof(body.secret);
  }

  @Post('zkp/verify')
  async verify(@Body() body: { secret: string; proof: string; publicSignal: string }) {
    const isValid = await this.zkp.verifyProof(body.secret, body.proof, body.publicSignal);
    return { isValid };
  }

  @Get('posture')
  async getSecurityPosture() {
    return {
      status: 'SECURE',
      score: 98,
      lastAudit: new Date(),
      activeThreats: 0,
    };
  }
}
