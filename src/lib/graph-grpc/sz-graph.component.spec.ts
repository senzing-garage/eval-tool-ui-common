import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzGraphComponentGrpc } from './sz-graph.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzGraphComponent', () => {
  let component: SzGraphComponentGrpc;
  let fixture: ComponentFixture<SzGraphComponentGrpc>;

  /*
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot(), SenzingSdkGraphModule.forRoot()]
    })
    .compileComponents();
  }));
  */

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzGraphComponentGrpc);
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
