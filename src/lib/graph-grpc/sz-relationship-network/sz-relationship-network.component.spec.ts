import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRelationshipNetworkComponent } from './sz-relationship-network.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzRelationshipNetworkComponent', () => {
  let component: SzRelationshipNetworkComponent;
  let fixture: ComponentFixture<SzRelationshipNetworkComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzRelationshipNetworkComponent],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzRelationshipNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
