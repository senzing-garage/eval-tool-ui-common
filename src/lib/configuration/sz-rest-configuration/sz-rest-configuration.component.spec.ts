import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRestConfigurationComponent } from './sz-rest-configuration.component';
import { SenzingSdkModule } from '../../sdk.module';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzRestConfigurationComponent', () => {
  let component: SzRestConfigurationComponent;
  let fixture: ComponentFixture<SzRestConfigurationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzRestConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
