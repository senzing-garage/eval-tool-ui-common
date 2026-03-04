import { TestBed } from '@angular/core/testing';

import { SzSearchService } from './sz-search.service';
import { SenzingSdkModule } from 'src/lib/sdk.module';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';
//
describe('SzSearchService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [SenzingSdkModule.forRoot()],
      providers: [...MOCK_TEST_PROVIDERS]
  }));

  it('should be created', () => {
    const service: SzSearchService = TestBed.inject(SzSearchService);
    expect(service).toBeTruthy();
  });
});
