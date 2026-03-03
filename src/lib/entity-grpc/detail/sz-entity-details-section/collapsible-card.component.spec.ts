import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailSectionCollapsibleCardComponentGrpc } from './collapsible-card.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzEntityDetailSectionCollapsibleCardComponent', () => {
  let component: SzEntityDetailSectionCollapsibleCardComponentGrpc;
  let fixture: ComponentFixture<SzEntityDetailSectionCollapsibleCardComponentGrpc>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzEntityDetailSectionCollapsibleCardComponentGrpc],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailSectionCollapsibleCardComponentGrpc);
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
