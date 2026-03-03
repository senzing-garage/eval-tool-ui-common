import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzSearchByIdGrpcComponent } from './sz-search-by-id.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';


describe('SzSearchByIdComponent', () => {
  let component: SzSearchByIdGrpcComponent;
  let fixture: ComponentFixture<SzSearchByIdGrpcComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzSearchByIdGrpcComponent],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzSearchByIdGrpcComponent);
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
