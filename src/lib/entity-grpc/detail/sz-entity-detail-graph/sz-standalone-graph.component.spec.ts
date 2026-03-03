import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzStandaloneGraphComponent } from './sz-standalone-graph.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzStandaloneGraphComponent', () => {
  let component: SzStandaloneGraphComponent;
  let fixture: ComponentFixture<SzStandaloneGraphComponent>;

  /*
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot(), SenzingSdkGraphModule.forRoot()]
    })
    .compileComponents();
  }));
  */

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SzStandaloneGraphComponent],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzStandaloneGraphComponent);
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
