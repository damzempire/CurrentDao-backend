import { Module } from '@nestjs/common';

  controllers: [AppController, HealthController, ApiHealthController],
  providers: [AppService],
})
export class AppModule {}
