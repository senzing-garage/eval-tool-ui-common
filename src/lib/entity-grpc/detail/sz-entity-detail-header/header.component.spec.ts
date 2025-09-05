import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailHeaderComponentGrpc } from './header.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailHeaderComponent', () => {
  let component: SzEntityDetailHeaderComponentGrpc;
  let fixture: ComponentFixture<SzEntityDetailHeaderComponentGrpc>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzEntityDetailHeaderComponentGrpc);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
