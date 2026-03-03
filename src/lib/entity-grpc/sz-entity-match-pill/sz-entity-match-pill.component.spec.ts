import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityMatchPillComponent } from './sz-entity-match-pill.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzEntityMatchPillComponent', () => {
  let component: SzEntityMatchPillComponent;
  let fixture: ComponentFixture<SzEntityMatchPillComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzEntityMatchPillComponent],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityMatchPillComponent);
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
