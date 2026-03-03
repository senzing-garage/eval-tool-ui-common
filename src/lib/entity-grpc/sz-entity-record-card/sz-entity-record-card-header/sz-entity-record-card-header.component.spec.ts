import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityRecordCardHeaderComponentGrpc } from './sz-entity-record-card-header.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzEntityRecordCardHeaderComponentGrpc', () => {
  let component: SzEntityRecordCardHeaderComponentGrpc;
  let fixture: ComponentFixture<SzEntityRecordCardHeaderComponentGrpc>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzEntityRecordCardHeaderComponentGrpc],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityRecordCardHeaderComponentGrpc);
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
