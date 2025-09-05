import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailHeaderContentComponentGrpc } from './content.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailHeaderContentComponent', () => {
  let component: SzEntityDetailHeaderContentComponentGrpc;
  let fixture: ComponentFixture<SzEntityDetailHeaderContentComponentGrpc>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzEntityDetailHeaderContentComponentGrpc);
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
