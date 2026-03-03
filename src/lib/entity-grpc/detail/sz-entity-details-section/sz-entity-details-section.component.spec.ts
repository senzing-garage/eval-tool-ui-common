import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailsSectionComponentGrpc } from './sz-entity-details-section.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzEntityDetailsSectionComponent', () => {
  let component: SzEntityDetailsSectionComponentGrpc;
  let fixture: ComponentFixture<SzEntityDetailsSectionComponentGrpc>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzEntityDetailsSectionComponentGrpc],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailsSectionComponentGrpc);
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
