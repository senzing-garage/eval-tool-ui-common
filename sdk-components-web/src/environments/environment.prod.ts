import { SzRestConfigurationParameters } from '@senzing/sz-sdk-components-grpc-web';

export const environment = {
  production: true
};

// api configuration parameters
export const apiConfig: SzRestConfigurationParameters = {
  'basePath': '/api',
  'withCredentials': true
};