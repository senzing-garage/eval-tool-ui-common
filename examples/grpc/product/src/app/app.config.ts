import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { SzGrpcWebEnvironment } from '@senzing/sz-sdk-typescript-grpc-web';
import { SenzingSdkModule, SzRestConfiguration } from '@senzing/sz-sdk-components-grpc-web';
import { SzGraphEnvironment } from '@senzing/eval-tool-ui-common';

const grpcSdkEnv = new SzGrpcWebEnvironment({
    connectionString: `http://localhost:8260/grpc`
});
const restSdkEnv = () => new SzRestConfiguration({
  'basePath': '/api',
  'withCredentials': true
});
const graphStorageEnv = new SzGraphEnvironment({
  basePath: 'http://localhost:3000/api'
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom( SenzingSdkModule.forRoot(restSdkEnv)),
    {provide: 'GRPC_ENVIRONMENT', useValue: grpcSdkEnv},
    {provide: 'GRAPH_ENVIRONMENT', useValue: graphStorageEnv}
  ]
};
