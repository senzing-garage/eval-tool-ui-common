import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailHeaderContentComponentGrpc } from './content.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzEntityDetailHeaderContentComponent', () => {
  let component: SzEntityDetailHeaderContentComponentGrpc;
  let fixture: ComponentFixture<SzEntityDetailHeaderContentComponentGrpc>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzEntityDetailHeaderContentComponentGrpc],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzEntityDetailHeaderContentComponentGrpc);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    // test fails on CI only (issue #75)
    // temporarily removing until more is known
    expect(component).toBeTruthy();
  });
});
