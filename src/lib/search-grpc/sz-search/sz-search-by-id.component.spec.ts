import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzSearchByIdGrpcComponent } from './sz-search-by-id.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';


describe('SzSearchByIdComponent', () => {
  let component: SzSearchByIdGrpcComponent;
  let fixture: ComponentFixture<SzSearchByIdGrpcComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
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
