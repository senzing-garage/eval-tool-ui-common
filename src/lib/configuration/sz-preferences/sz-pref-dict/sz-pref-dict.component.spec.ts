import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzPrefDictComponent } from './sz-pref-dict.component';
import { MOCK_TEST_PROVIDERS } from 'src/lib/testing/mock-grpc-environment';

describe('SzConfigurationAboutComponent', () => {
  let component: SzPrefDictComponent;
  let fixture: ComponentFixture<SzPrefDictComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SzPrefDictComponent],
      providers: [...MOCK_TEST_PROVIDERS]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzPrefDictComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
