import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailHeaderComponentGrpc } from './header.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzEntityDetailHeaderComponent', () => {
  let component: SzEntityDetailHeaderComponentGrpc;
  let fixture: ComponentFixture<SzEntityDetailHeaderComponentGrpc>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzEntityDetailHeaderComponentGrpc],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzEntityDetailHeaderComponentGrpc);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
