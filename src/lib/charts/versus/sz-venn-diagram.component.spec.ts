import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzVennDiagramsComponent } from './sz-venn-diagram.component';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MockTestDataInterceptor } from 'src/lib/interceptors/mock-test-data.interceptor.service';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzVennDiagramsComponent', () => {
  let component: SzVennDiagramsComponent;
  let fixture: ComponentFixture<SzVennDiagramsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzVennDiagramsComponent],
      providers: [...MOCK_TEST_PROVIDERS, {
          provide: HTTP_INTERCEPTORS,
          useClass: MockTestDataInterceptor,
          multi: true
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzVennDiagramsComponent);
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
