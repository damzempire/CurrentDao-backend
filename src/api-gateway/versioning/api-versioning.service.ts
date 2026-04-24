import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ApiVersioningService {
  private readonly logger = new Logger(ApiVersioningService.name);
  private readonly versions = new Map<string, { status: 'ACTIVE' | 'DEPRECATED' | 'RETIRED' }>();

  constructor() {
    this.versions.set('v1', { status: 'DEPRECATED' });
    this.versions.set('v2', { status: 'ACTIVE' });
  }

  isVersionActive(version: string): boolean {
    const v = this.versions.get(version);
    return v?.status === 'ACTIVE' || v?.status === 'DEPRECATED';
  }

  getVersionStatus(version: string) {
    return this.versions.get(version);
  }
}
