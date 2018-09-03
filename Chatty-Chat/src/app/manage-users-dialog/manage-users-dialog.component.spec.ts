import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageUsersDialogComponent } from './manage-users-dialog.component';

describe('ManageUsersDialogComponent', () => {
  let component: ManageUsersDialogComponent;
  let fixture: ComponentFixture<ManageUsersDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageUsersDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageUsersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
