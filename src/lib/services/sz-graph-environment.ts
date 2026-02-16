export interface SzGraphEnvironmentParameters {
  basePath?: string;
}

export class SzGraphEnvironment {
  basePath?: string;

  constructor(configurationParameters: SzGraphEnvironmentParameters = {}) {
    this.basePath = configurationParameters.basePath;
  }
}
