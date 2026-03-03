import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzWhyEntityComponent } from './sz-why-entity.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzPoweredByComponent', () => {
  let component: SzWhyEntityComponent;
  let fixture: ComponentFixture<SzWhyEntityComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzWhyEntityComponent);
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
