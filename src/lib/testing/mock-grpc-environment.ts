import { Provider, EnvironmentProviders } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Configuration as SzRestConfiguration } from '@senzing/rest-api-client-ng';
import { SzDataMartEnvironment } from '../services/http/sz-datamart-environment';

/**
 * Mock gRPC environment provider for unit tests.
 *
 * Provides stub engine, product, and configManager objects so
 * TestBed can instantiate components without a live gRPC server.
 */
export const MOCK_GRPC_ENVIRONMENT = {
  engine: undefined,
  product: undefined,
  configManager: undefined,
  addEventListener: () => {},
};

export const MOCK_GRPC_PROVIDER: Provider = {
  provide: 'GRPC_ENVIRONMENT',
  useValue: MOCK_GRPC_ENVIRONMENT,
};

export const MOCK_DATAMART_PROVIDER: Provider = {
  provide: 'DATAMART_ENVIRONMENT',
  useValue: new SzDataMartEnvironment({ basePath: 'http://localhost:8080' }),
};

export const MOCK_REST_PROVIDER: Provider = {
  provide: 'REST_ENVIRONMENT',
  useValue: new SzRestConfiguration({ basePath: 'http://localhost:8080' }),
};

/**
 * Standard set of providers for standalone component tests.
 * Provides mock gRPC/REST/DataMart environments and HttpClient.
 */
export const MOCK_TEST_PROVIDERS: (Provider | EnvironmentProviders)[] = [
  MOCK_GRPC_PROVIDER,
  MOCK_DATAMART_PROVIDER,
  MOCK_REST_PROVIDER,
  provideHttpClient(withInterceptorsFromDi()),
];
