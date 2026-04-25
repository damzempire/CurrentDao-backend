import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { IpGeolocationService } from './geolocation/ip-geolocation.service';
import { LocationRulesService } from './rules/location-rules.service';
import { GeographicAnalyticsService } from './analytics/geographic-analytics.service';
import { LocationVerificationService } from './validation/location-verification.service';
import { MappingService } from './integration/mapping-service';
import { Location } from './entities/location.entity';
import { GridZone } from './entities/grid-zone.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location, GridZone]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [LocationController],
  providers: [
    LocationService,
    IpGeolocationService,
    LocationRulesService,
    GeographicAnalyticsService,
    LocationVerificationService,
    MappingService,
  ],
  exports: [
    LocationService,
    IpGeolocationService,
    LocationRulesService,
    GeographicAnalyticsService,
    LocationVerificationService,
    MappingService,
  ],
})
export class LocationModule {}
