import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzConfigurationAboutComponent } from './sz-configuration-about.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzConfigurationAboutComponent', () => {
  let component: SzConfigurationAboutComponent;
  let fixture: ComponentFixture<SzConfigurationAboutComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzConfigurationAboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
