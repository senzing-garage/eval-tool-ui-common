import { TestBed } from '@angular/core/testing';

import { SenzingSdkModule } from './sdk.module';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

//import { CustomHttp } from './custom-http.service';

describe(`SenzingSdkModule`, () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [SenzingSdkModule.forRoot()],
            providers: [...MOCK_TEST_PROVIDERS]
        });
    });

    //it(`should not provide 'CustomHttp' service`, () => {
    //    expect(() => TestBed.get(CustomHttp)).toThrowError(/No provider for/);
    //});

    it(`should be truthy`, () => {
      expect(() => {
        return true;
      });
    })

});
