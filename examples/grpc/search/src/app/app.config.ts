import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { SzGrpcWebEnvironment } from '@senzing/sz-sdk-typescript-grpc-web';
import { SenzingSdkModule, SzRestConfiguration } from '@senzing/eval-tool-ui-common';
import { Title } from '@angular/platform-browser';

const grpcSdkEnv = new SzGrpcWebEnvironment({
    connectionString: `http://localhost:8260/grpc`
});
const restSdkEnv = new SzRestConfiguration({
  'basePath': '/api',
  'withCredentials': true
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    {provide: 'GRPC_ENVIRONMENT', useValue: grpcSdkEnv},
    {provide: 'REST_ENVIRONMENT', useValue: restSdkEnv},
//    SzWebAppConfigService,
//    EntitySearchService,
//    AdminAuthService,
//    AboutInfoService,
//    AdminBulkDataService,
    Title
  ]
};
