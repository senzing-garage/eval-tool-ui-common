import { SzRestConfigurationParameters } from '@senzing/sz-sdk-components-grpc-web';

export const environment = {
  production: true,
  test: false
};

// api configuration parameters
export const apiConfig: SzRestConfigurationParameters = {
  'withCredentials': true
};
