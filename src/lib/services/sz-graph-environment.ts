/** Configuration parameters for {@link SzGraphEnvironment}. */
export interface SzGraphEnvironmentParameters {
  /** Base URL of the eval-tool-app-storage REST API (e.g. `http://localhost:3000/api`). */
  basePath?: string;
}

/**
 * Environment configuration for the graph storage backend.
 * Provide an instance via the `'GRAPH_ENVIRONMENT'` injection token to
 * configure the {@link SzGraphStorageService} base URL.
 */
export class SzGraphEnvironment {
  /** Base URL of the eval-tool-app-storage REST API. */
  basePath?: string;

  constructor(configurationParameters: SzGraphEnvironmentParameters = {}) {
    this.basePath = configurationParameters.basePath;
  }
}
