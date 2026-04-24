import { Injectable } from '@nestjs/common';

export interface RouteConfig {
  serviceName: string;
  baseUrl: string;
  weight: number;
}

@Injectable()
export class ApiRouterService {
  private readonly routes = new Map<string, RouteConfig[]>();

  constructor() {
    this.registerRoute('weather', { serviceName: 'weather-v1', baseUrl: 'https://api.weather.com/v1', weight: 1 });
    this.registerRoute('energy', { serviceName: 'energy-main', baseUrl: 'https://provider.energy.com/api', weight: 1 });
  }

  registerRoute(alias: string, config: RouteConfig) {
    const existing = this.routes.get(alias) || [];
    existing.push(config);
    this.routes.set(alias, existing);
  }

  resolveRoute(alias: string): RouteConfig {
    const configs = this.routes.get(alias);
    if (!configs || configs.length === 0) {
      throw new Error(`No route found for alias: ${alias}`);
    }

    // Simple round-robin or random for now
    return configs[Math.floor(Math.random() * configs.length)];
  }
}
