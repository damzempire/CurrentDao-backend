import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface GeolocationData {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  accuracy: number;
}

export interface GeolocationResult {
  success: boolean;
  data?: GeolocationData;
  error?: string;
  timestamp: Date;
}

@Injectable()
export class IpGeolocationService {
  private readonly logger = new Logger(IpGeolocationService.name);
  private readonly geoProviders = ['ipapi', 'ipstack', 'geoip2'];
  private currentProviderIndex = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getLocationByIp(ip: string): Promise<GeolocationResult> {
    const startTime = Date.now();
    
    try {
      for (let attempt = 0; attempt < this.geoProviders.length; attempt++) {
        const provider = this.geoProviders[this.currentProviderIndex];
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.geoProviders.length;
        
        try {
          const result = await this.queryProvider(provider, ip);
          if (result.success) {
            const responseTime = Date.now() - startTime;
            this.logger.log(`Geolocation successful for IP ${ip} via ${provider} in ${responseTime}ms`);
            return result;
          }
        } catch (error) {
          this.logger.warn(`Provider ${provider} failed for IP ${ip}: ${error.message}`);
          continue;
        }
      }
      
      return {
        success: false,
        error: 'All geolocation providers failed',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Geolocation error for IP ${ip}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  private async queryProvider(provider: string, ip: string): Promise<GeolocationResult> {
    switch (provider) {
      case 'ipapi':
        return this.queryIpApi(ip);
      case 'ipstack':
        return this.queryIpStack(ip);
      case 'geoip2':
        return this.queryGeoIp2(ip);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async queryIpApi(ip: string): Promise<GeolocationResult> {
    const apiKey = this.configService.get<string>('IPAPI_API_KEY');
    const url = apiKey 
      ? `https://api.ipapi.com/api/${ip}?access_key=${apiKey}`
      : `http://ip-api.com/json/${ip}`;

    const response = await firstValueFrom(
      this.httpService.get(url, { timeout: 5000 })
    );

    const data = response.data;
    
    if (data.status === 'fail') {
      throw new Error(data.message || 'IP API query failed');
    }

    return {
      success: true,
      data: {
        ip: data.query || ip,
        country: data.country || '',
        countryCode: data.countryCode || '',
        city: data.city || '',
        region: data.regionName || data.region || '',
        latitude: data.lat || 0,
        longitude: data.lon || 0,
        timezone: data.timezone || '',
        isp: data.isp || data.org || '',
        accuracy: 0.99,
      },
      timestamp: new Date(),
    };
  }

  private async queryIpStack(ip: string): Promise<GeolocationResult> {
    const apiKey = this.configService.get<string>('IPSTACK_API_KEY');
    if (!apiKey) {
      throw new Error('IPStack API key not configured');
    }

    const url = `http://api.ipstack.com/${ip}?access_key=${apiKey}`;
    
    const response = await firstValueFrom(
      this.httpService.get(url, { timeout: 5000 })
    );

    const data = response.data;
    
    if (data.error) {
      throw new Error(data.error.info || 'IPStack query failed');
    }

    return {
      success: true,
      data: {
        ip: data.ip || ip,
        country: data.country_name || '',
        countryCode: data.country_code || '',
        city: data.city || '',
        region: data.region_name || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        timezone: data.time_zone?.id || '',
        isp: data.connection?.isp || '',
        accuracy: 0.98,
      },
      timestamp: new Date(),
    };
  }

  private async queryGeoIp2(ip: string): Promise<GeolocationResult> {
    const apiKey = this.configService.get<string>('GEOIP2_API_KEY');
    if (!apiKey) {
      throw new Error('GeoIP2 API key not configured');
    }

    const url = `https://geoip.maxmind.com/geoip/v2.1/city/${ip}`;
    
    const response = await firstValueFrom(
      this.httpService.get(url, {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })
    );

    const data = response.data;
    
    return {
      success: true,
      data: {
        ip: data.traits?.ip_address || ip,
        country: data.country?.names?.en || '',
        countryCode: data.country?.iso_code || '',
        city: data.city?.names?.en || '',
        region: data.subdivisions?.[0]?.names?.en || '',
        latitude: data.location?.latitude || 0,
        longitude: data.location?.longitude || 0,
        timezone: data.location?.time_zone || '',
        isp: data.traits?.autonomous_system_organization || '',
        accuracy: 0.995,
      },
      timestamp: new Date(),
    };
  }

  async validateLocationAccuracy(location: GeolocationData): Promise<boolean> {
    const requiredFields = ['country', 'countryCode', 'latitude', 'longitude'];
    const hasAllFields = requiredFields.every(field => 
      location[field] !== undefined && location[field] !== null && location[field] !== ''
    );

    if (!hasAllFields) {
      return false;
    }

    const isValidLat = location.latitude >= -90 && location.latitude <= 90;
    const isValidLon = location.longitude >= -180 && location.longitude <= 180;
    
    return isValidLat && isValidLon && location.accuracy >= 0.95;
  }

  async getLocationByCoordinates(lat: number, lon: number): Promise<GeolocationResult> {
    try {
      const apiKey = this.configService.get<string>('OPENCAGE_API_KEY');
      if (!apiKey) {
        throw new Error('OpenCage API key not configured');
      }

      const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${apiKey}`;
      
      const response = await firstValueFrom(
        this.httpService.get(url, { timeout: 5000 })
      );

      const data = response.data;
      
      if (data.results.length === 0) {
        throw new Error('No results found for coordinates');
      }

      const result = data.results[0];
      const components = result.components;

      return {
        success: true,
        data: {
          ip: '',
          country: components.country || '',
          countryCode: components.country_code || components.ISO_3166_1_alpha_2 || '',
          city: components.city || components.town || components.village || '',
          region: components.state || components.region || '',
          latitude: lat,
          longitude: lon,
          timezone: '',
          isp: '',
          accuracy: 0.95,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}
