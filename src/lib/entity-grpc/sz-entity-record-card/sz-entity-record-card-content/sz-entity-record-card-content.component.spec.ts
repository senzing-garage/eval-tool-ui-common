import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityRecordCardContentComponentGrpc } from './sz-entity-record-card-content.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzEntityRecordCardContentComponent', () => {
  let component: SzEntityRecordCardContentComponentGrpc;
  let fixture: ComponentFixture<SzEntityRecordCardContentComponentGrpc>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzEntityRecordCardContentComponentGrpc],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityRecordCardContentComponentGrpc);
    component = fixture.componentInstance;
    // detectChanges() omitted — component requires data inputs to render safely
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
