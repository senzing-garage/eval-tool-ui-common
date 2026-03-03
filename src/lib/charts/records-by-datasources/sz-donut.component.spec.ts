import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRecordStatsDonutChart } from './sz-donut.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MockTestDataInterceptor } from 'src/lib/interceptors/mock-test-data.interceptor.service';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzRecordStatsDonutChart', () => {
  let component: SzRecordStatsDonutChart;
  let fixture: ComponentFixture<SzRecordStatsDonutChart>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzRecordStatsDonutChart],
      providers: [...MOCK_TEST_PROVIDERS, {
          provide: HTTP_INTERCEPTORS,
          useClass: MockTestDataInterceptor,
          multi: true
        }
       ]    
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzRecordStatsDonutChart);
    component = fixture.componentInstance;
    // detectChanges() omitted — component makes HTTP calls during init
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    // temporarily removing until more is known
    expect(component).toBeTruthy();
  });
});
