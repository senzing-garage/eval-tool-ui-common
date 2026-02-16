import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { SzGrpcWebEnvironment } from '@senzing/sz-sdk-typescript-grpc-web';
import { SzRestConfiguration, SzGraphEnvironment, SzDataMartEnvironment } from '@senzing/eval-tool-ui-common';
import { Title } from '@angular/platform-browser';

const grpcSdkEnv = new SzGrpcWebEnvironment({
    connectionString: `http://localhost:8261`
});
const restSdkEnv = new SzRestConfiguration({
  'basePath': '/api',
  'withCredentials': true
});
const graphStorageEnv = new SzGraphEnvironment({
  basePath: 'http://localhost:3000/api'
});
const datamartEnv = new SzDataMartEnvironment({
  basePath: 'http://localhost:8261/data-mart',
  withCredentials: false
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(routes),
    {provide: 'GRPC_ENVIRONMENT', useValue: grpcSdkEnv},
    {provide: 'REST_ENVIRONMENT', useValue: restSdkEnv},
    {provide: 'GRAPH_ENVIRONMENT', useValue: graphStorageEnv},
    {provide: 'DATAMART_ENVIRONMENT', useValue: datamartEnv},
    Title
  ]
};
