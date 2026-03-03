import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzPoweredByComponent } from './sz-powered-by.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzPoweredByComponent', () => {
  let component: SzPoweredByComponent;
  let fixture: ComponentFixture<SzPoweredByComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzPoweredByComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
