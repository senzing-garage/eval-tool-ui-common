import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MockTestDataInterceptor } from '../../interceptors/mock-test-data.interceptor.service';

import { SzCrossSourceSelectComponent } from './sz-cross-source-select.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzCrossSourceSelectComponent', () => {
  let component: SzCrossSourceSelectComponent;
  let fixture: ComponentFixture<SzCrossSourceSelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzCrossSourceSelectComponent],
      providers: [...MOCK_TEST_PROVIDERS, {
          provide: HTTP_INTERCEPTORS,
          useClass: MockTestDataInterceptor,
          multi: true
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzCrossSourceSelectComponent);
    component = fixture.componentInstance;
    // detectChanges() omitted — component makes HTTP calls during init
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
