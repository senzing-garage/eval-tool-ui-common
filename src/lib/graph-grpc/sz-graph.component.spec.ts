import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzGraphComponentGrpc } from './sz-graph.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzGraphComponent', () => {
  let component: SzGraphComponentGrpc;
  let fixture: ComponentFixture<SzGraphComponentGrpc>;

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
      imports: [SzGraphComponentGrpc],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzGraphComponentGrpc);
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
