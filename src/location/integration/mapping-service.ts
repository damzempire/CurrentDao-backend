import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GeolocationData } from '../geolocation/ip-geolocation.service';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  type: 'user' | 'transaction' | 'facility' | 'event' | 'alert';
  icon?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  data?: Record<string, any>;
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'markers' | 'heatmap' | 'polygons' | 'routes' | 'clusters';
  visible: boolean;
  opacity: number;
  data: any;
  style?: Record<string, any>;
}

export interface GeographicBoundary {
  id: string;
  type: 'country' | 'state' | 'city' | 'region' | 'custom';
  name: string;
  coordinates: number[][][];
  properties: Record<string, any>;
}

export interface RouteData {
  id: string;
  startPoint: { latitude: number; longitude: number };
  endPoint: { latitude: number; longitude: number };
  waypoints?: { latitude: number; longitude: number }[];
  distance: number;
  duration: number;
  mode: 'driving' | 'walking' | 'cycling' | 'transit';
  geometry: number[][];
}

export interface MapVisualization {
  id: string;
  name: string;
  type: 'choropleth' | 'bubble' | 'flow' | 'density' | 'trajectory';
  center: { latitude: number; longitude: number };
  zoom: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  layers: MapLayer[];
  controls: {
    zoom: boolean;
    layers: boolean;
    fullscreen: boolean;
    search: boolean;
  };
}

export interface MapStyle {
  id: string;
  name: string;
  type: 'roadmap' | 'satellite' | 'terrain' | 'dark' | 'light';
  url?: string;
  config?: Record<string, any>;
}

@Injectable()
export class MappingService {
  private readonly logger = new Logger(MappingService.name);
  private readonly mapProviders = ['google', 'mapbox', 'openstreetmap', 'here'];
  private currentProviderIndex = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async generateMapVisualization(
    data: GeolocationData[],
    visualizationType: 'users' | 'transactions' | 'analytics' | 'compliance' = 'users',
  ): Promise<MapVisualization> {
    try {
      this.logger.log(`Generating ${visualizationType} map visualization`);

      const markers = await this.createMarkers(data, visualizationType);
      const heatmapData = await this.createHeatmapData(data);
      const bounds = this.calculateBounds(data);

      const visualization: MapVisualization = {
        id: `${visualizationType}_${Date.now()}`,
        name: `${visualizationType.charAt(0).toUpperCase() + visualizationType.slice(1)} Map`,
        type: 'density',
        center: this.calculateCenter(bounds),
        zoom: this.calculateOptimalZoom(bounds),
        bounds,
        layers: [
          {
            id: 'base_layer',
            name: 'Base Map',
            type: 'markers',
            visible: true,
            opacity: 1,
            data: markers,
          },
          {
            id: 'heatmap_layer',
            name: 'Density Heatmap',
            type: 'heatmap',
            visible: false,
            opacity: 0.7,
            data: heatmapData,
          },
        ],
        controls: {
          zoom: true,
          layers: true,
          fullscreen: true,
          search: true,
        },
      };

      return visualization;
    } catch (error) {
      this.logger.error(`Error generating map visualization: ${error.message}`);
      throw error;
    }
  }

  private async createMarkers(
    data: GeolocationData[],
    type: string,
  ): Promise<MapMarker[]> {
    return data.map((location, index) => ({
      id: `marker_${index}`,
      latitude: location.latitude,
      longitude: location.longitude,
      title: `${location.city}, ${location.country}`,
      description: `IP: ${location.ip} | ISP: ${location.isp}`,
      type: type as any,
      icon: this.getMarkerIcon(type),
      color: this.getMarkerColor(type),
      size: 'medium',
      data: {
        ip: location.ip,
        accuracy: location.accuracy,
        timezone: location.timezone,
      },
    }));
  }

  private async createHeatmapData(data: GeolocationData[]): Promise<any> {
    return data.map(location => ({
      latitude: location.latitude,
      longitude: location.longitude,
      intensity: location.accuracy,
      weight: 1,
    }));
  }

  private calculateBounds(data: GeolocationData[]) {
    if (data.length === 0) {
      return {
        north: 90,
        south: -90,
        east: 180,
        west: -180,
      };
    }

    const lats = data.map(d => d.latitude);
    const lons = data.map(d => d.longitude);

    return {
      north: Math.max(...lats) + 0.1,
      south: Math.min(...lats) - 0.1,
      east: Math.max(...lons) + 0.1,
      west: Math.min(...lons) - 0.1,
    };
  }

  private calculateCenter(bounds: any) {
    return {
      latitude: (bounds.north + bounds.south) / 2,
      longitude: (bounds.east + bounds.west) / 2,
    };
  }

  private calculateOptimalZoom(bounds: any): number {
    const latDiff = bounds.north - bounds.south;
    const lonDiff = bounds.east - bounds.west;
    const maxDiff = Math.max(latDiff, lonDiff);
    
    if (maxDiff > 10) return 2;
    if (maxDiff > 5) return 4;
    if (maxDiff > 2) return 6;
    if (maxDiff > 1) return 8;
    if (maxDiff > 0.5) return 10;
    if (maxDiff > 0.1) return 12;
    return 14;
  }

  private getMarkerIcon(type: string): string {
    const icons = {
      users: 'user',
      transactions: 'dollar',
      analytics: 'chart',
      compliance: 'shield',
    };
    return icons[type] || 'marker';
  }

  private getMarkerColor(type: string): string {
    const colors = {
      users: '#3B82F6',
      transactions: '#10B981',
      analytics: '#F59E0B',
      compliance: '#EF4444',
    };
    return colors[type] || '#6B7280';
  }

  async getGeographicBoundaries(
    boundaryType: 'country' | 'state' | 'city',
    countryCode?: string,
  ): Promise<GeographicBoundary[]> {
    try {
      const provider = this.mapProviders[this.currentProviderIndex];
      
      switch (provider) {
        case 'google':
          return this.getGoogleBoundaries(boundaryType, countryCode);
        case 'mapbox':
          return this.getMapboxBoundaries(boundaryType, countryCode);
        case 'openstreetmap':
          return this.getOSMBoundaries(boundaryType, countryCode);
        default:
          throw new Error(`Unsupported map provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error(`Error fetching geographic boundaries: ${error.message}`);
      return [];
    }
  }

  private async getGoogleBoundaries(
    boundaryType: string,
    countryCode?: string,
  ): Promise<GeographicBoundary[]> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Simulate Google Maps boundaries API call
    return this.generateSampleBoundaries(boundaryType, countryCode);
  }

  private async getMapboxBoundaries(
    boundaryType: string,
    countryCode?: string,
  ): Promise<GeographicBoundary[]> {
    const apiKey = this.configService.get<string>('MAPBOX_API_KEY');
    if (!apiKey) {
      throw new Error('Mapbox API key not configured');
    }

    // Simulate Mapbox boundaries API call
    return this.generateSampleBoundaries(boundaryType, countryCode);
  }

  private async getOSMBoundaries(
    boundaryType: string,
    countryCode?: string,
  ): Promise<GeographicBoundary[]> {
    // Simulate OpenStreetMap boundaries API call
    return this.generateSampleBoundaries(boundaryType, countryCode);
  }

  private generateSampleBoundaries(
    boundaryType: string,
    countryCode?: string,
  ): GeographicBoundary[] {
    const sampleBoundaries: GeographicBoundary[] = [
      {
        id: 'US_NY',
        type: 'state',
        name: 'New York',
        coordinates: [[[ -74.255, 40.496], [-73.700, 40.496], [-73.700, 40.915], [-74.255, 40.915], [-74.255, 40.496]]],
        properties: {
          population: 8400000,
          area: 783.8,
          capital: 'Albany',
        },
      },
      {
        id: 'US_CA',
        type: 'state',
        name: 'California',
        coordinates: [[[ -124.409, 32.534], [-114.131, 32.534], [-114.131, 42.009], [-124.409, 42.009], [-124.409, 32.534]]],
        properties: {
          population: 39500000,
          area: 423967,
          capital: 'Sacramento',
        },
      },
    ];

    return sampleBoundaries.filter(boundary => 
      !countryCode || boundary.id.startsWith(countryCode.toUpperCase())
    );
  }

  async calculateRoute(
    startPoint: { latitude: number; longitude: number },
    endPoint: { latitude: number; longitude: number },
    mode: 'driving' | 'walking' | 'cycling' | 'transit' = 'driving',
  ): Promise<RouteData> {
    try {
      const provider = this.mapProviders[this.currentProviderIndex];
      
      switch (provider) {
        case 'google':
          return this.getGoogleRoute(startPoint, endPoint, mode);
        case 'mapbox':
          return this.getMapboxRoute(startPoint, endPoint, mode);
        case 'openstreetmap':
          return this.getOSMRoute(startPoint, endPoint, mode);
        default:
          throw new Error(`Unsupported map provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error(`Error calculating route: ${error.message}`);
      throw error;
    }
  }

  private async getGoogleRoute(
    startPoint: any,
    endPoint: any,
    mode: string,
  ): Promise<RouteData> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Simulate Google Maps Directions API call
    return this.generateSampleRoute(startPoint, endPoint, mode);
  }

  private async getMapboxRoute(
    startPoint: any,
    endPoint: any,
    mode: string,
  ): Promise<RouteData> {
    const apiKey = this.configService.get<string>('MAPBOX_API_KEY');
    if (!apiKey) {
      throw new Error('Mapbox API key not configured');
    }

    // Simulate Mapbox Directions API call
    return this.generateSampleRoute(startPoint, endPoint, mode);
  }

  private async getOSMRoute(
    startPoint: any,
    endPoint: any,
    mode: string,
  ): Promise<RouteData> {
    // Simulate OpenStreetMap routing API call
    return this.generateSampleRoute(startPoint, endPoint, mode);
  }

  private generateSampleRoute(
    startPoint: any,
    endPoint: any,
    mode: string,
  ): RouteData {
    const distance = this.calculateDistance(startPoint, endPoint);
    const speedFactors = {
      driving: 60, // km/h
      walking: 5,  // km/h
      cycling: 15, // km/h
      transit: 40, // km/h
    };
    
    const duration = (distance / speedFactors[mode]) * 60 * 60; // seconds

    return {
      id: `route_${Date.now()}`,
      startPoint,
      endPoint,
      distance,
      duration,
      mode,
      geometry: this.generateRouteGeometry(startPoint, endPoint),
    };
  }

  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number },
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private generateRouteGeometry(
    startPoint: any,
    endPoint: any,
  ): number[][] {
    // Generate a simple straight-line geometry
    const steps = 10;
    const geometry = [];
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      geometry.push([
        startPoint.longitude + (endPoint.longitude - startPoint.longitude) * ratio,
        startPoint.latitude + (endPoint.latitude - startPoint.latitude) * ratio,
      ]);
    }
    
    return geometry;
  }

  async geocodeAddress(address: string): Promise<{
    latitude: number;
    longitude: number;
    formattedAddress: string;
    components: Record<string, string>;
  }> {
    try {
      const provider = this.mapProviders[this.currentProviderIndex];
      
      switch (provider) {
        case 'google':
          return this.geocodeWithGoogle(address);
        case 'mapbox':
          return this.geocodeWithMapbox(address);
        case 'openstreetmap':
          return this.geocodeWithOSM(address);
        default:
          throw new Error(`Unsupported map provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error(`Error geocoding address: ${error.message}`);
      throw error;
    }
  }

  private async geocodeWithGoogle(address: string): Promise<any> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Simulate Google Geocoding API call
    return this.generateSampleGeocode(address);
  }

  private async geocodeWithMapbox(address: string): Promise<any> {
    const apiKey = this.configService.get<string>('MAPBOX_API_KEY');
    if (!apiKey) {
      throw new Error('Mapbox API key not configured');
    }

    // Simulate Mapbox Geocoding API call
    return this.generateSampleGeocode(address);
  }

  private async geocodeWithOSM(address: string): Promise<any> {
    // Simulate OpenStreetMap Nominatim API call
    return this.generateSampleGeocode(address);
  }

  private generateSampleGeocode(address: string): any {
    // Generate sample geocoding results
    const sampleResults = {
      'New York, NY': {
        latitude: 40.7128,
        longitude: -74.0060,
        formattedAddress: 'New York, NY, USA',
        components: {
          city: 'New York',
          state: 'New York',
          country: 'United States',
          postal_code: '10001',
        },
      },
      'London, UK': {
        latitude: 51.5074,
        longitude: -0.1278,
        formattedAddress: 'London, UK',
        components: {
          city: 'London',
          country: 'United Kingdom',
        },
      },
    };

    // Return a default result if address not found
    return sampleResults[address] || {
      latitude: 0,
      longitude: 0,
      formattedAddress: address,
      components: {},
    };
  }

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<{
    address: string;
    components: Record<string, string>;
  }> {
    try {
      const provider = this.mapProviders[this.currentProviderIndex];
      
      switch (provider) {
        case 'google':
          return this.reverseGeocodeWithGoogle(latitude, longitude);
        case 'mapbox':
          return this.reverseGeocodeWithMapbox(latitude, longitude);
        case 'openstreetmap':
          return this.reverseGeocodeWithOSM(latitude, longitude);
        default:
          throw new Error(`Unsupported map provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error(`Error reverse geocoding: ${error.message}`);
      throw error;
    }
  }

  private async reverseGeocodeWithGoogle(lat: number, lon: number): Promise<any> {
    // Simulate Google Reverse Geocoding API call
    return this.generateSampleReverseGeocode(lat, lon);
  }

  private async reverseGeocodeWithMapbox(lat: number, lon: number): Promise<any> {
    // Simulate Mapbox Reverse Geocoding API call
    return this.generateSampleReverseGeocode(lat, lon);
  }

  private async reverseGeocodeWithOSM(lat: number, lon: number): Promise<any> {
    // Simulate OpenStreetMap Reverse Geocoding API call
    return this.generateSampleReverseGeocode(lat, lon);
  }

  private generateSampleReverseGeocode(lat: number, lon: number): any {
    // Generate sample reverse geocoding results
    return {
      address: 'Sample Address',
      components: {
        city: 'Sample City',
        country: 'Sample Country',
      },
    };
  }

  async getAvailableMapStyles(): Promise<MapStyle[]> {
    return [
      {
        id: 'roadmap',
        name: 'Roadmap',
        type: 'roadmap',
      },
      {
        id: 'satellite',
        name: 'Satellite',
        type: 'satellite',
      },
      {
        id: 'terrain',
        name: 'Terrain',
        type: 'terrain',
      },
      {
        id: 'dark',
        name: 'Dark',
        type: 'dark',
      },
      {
        id: 'light',
        name: 'Light',
        type: 'light',
      },
    ];
  }

  async getMapTileUrl(
    x: number,
    y: number,
    z: number,
    style: string = 'roadmap',
  ): Promise<string> {
    const provider = this.mapProviders[this.currentProviderIndex];
    
    switch (provider) {
      case 'google':
        return this.getGoogleTileUrl(x, y, z, style);
      case 'mapbox':
        return this.getMapboxTileUrl(x, y, z, style);
      case 'openstreetmap':
        return this.getOSMTileUrl(x, y, z, style);
      default:
        throw new Error(`Unsupported map provider: ${provider}`);
    }
  }

  private getGoogleTileUrl(x: number, y: number, z: number, style: string): string {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    return `https://mt1.google.com/vt/lyrs=${style}&x=${x}&y=${y}&z=${z}&key=${apiKey}`;
  }

  private getMapboxTileUrl(x: number, y: number, z: number, style: string): string {
    const apiKey = this.configService.get<string>('MAPBOX_API_KEY');
    const styleMap = {
      roadmap: 'mapbox/streets-v11',
      satellite: 'mapbox/satellite-v9',
      terrain: 'mapbox/outdoors-v11',
      dark: 'mapbox/dark-v10',
      light: 'mapbox/light-v10',
    };
    
    return `https://api.mapbox.com/styles/v1/${styleMap[style]}/tiles/${z}/${x}/${y}?access_token=${apiKey}`;
  }

  private getOSMTileUrl(x: number, y: number, z: number, style: string): string {
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }
}
