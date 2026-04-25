import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class DeveloperPortalService {
  private readonly developerKeys = new Map<string, { owner: string; name: string; created: Date }>();

  generateKey(owner: string, name: string): string {
    const key = `cd_${crypto.randomBytes(24).toString('hex')}`;
    this.developerKeys.set(key, { owner, name, created: new Date() });
    return key;
  }

  validateKey(key: string): boolean {
    return this.developerKeys.has(key);
  }

  getDeveloperApps(owner: string) {
    return Array.from(this.developerKeys.entries())
      .filter(([_, data]) => data.owner === owner)
      .map(([key, data]) => ({ key, ...data }));
  }
}
