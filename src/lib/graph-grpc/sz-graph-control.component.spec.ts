import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzGraphControlComponent } from './sz-graph-control.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzEntityDetailGraphControlComponent', () => {
  let component: SzGraphControlComponent;
  let fixture: ComponentFixture<SzGraphControlComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzGraphControlComponent],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzGraphControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to open', () => {
    expect(component.isOpen).toBeTruthy();
  });

  it('graph should default to show link labels', () => {
    expect(component.showLinkLabels).toBeTruthy();
  });
});
