import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiDocsService {
  async generateOpenApiSpec() {
    return {
      openapi: "3.0.0",
      info: {
        title: "CurrentDao API",
        version: "2.0.0",
        description: "Enterprise Energy DAO API"
      },
      paths: {
        "/gateway/health": {
          get: {
            summary: "Get gateway health status"
          }
        }
      }
    };
  }
}
