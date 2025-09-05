import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailGrpcComponent } from './sz-entity-detail.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailComponent', () => {
  let component: SzEntityDetailGrpcComponent;
  let fixture: ComponentFixture<SzEntityDetailGrpcComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailGrpcComponent);
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
