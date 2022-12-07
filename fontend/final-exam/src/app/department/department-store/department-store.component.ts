
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddAccountComponent } from '../add-account/add-account.component';
import { Department } from '../department.component';

export interface DepartmentReq {
  department: Department
}

@Component({
  selector: 'account-store',
  templateUrl: './department-store.component.html',
  styleUrls: ['./department-store.component.scss']
})
export class DepartmentStoreComponent implements OnInit {
  isUpdate: boolean;
  username = new FormControl(null, Validators.required);
  firstName = new FormControl(null, Validators.required);
  lastName = new FormControl(null, Validators.required);
  role = new FormControl(null, Validators.required);
  department = new FormControl(null, Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DepartmentReq,
    private dialogRef: MatDialogRef<DepartmentStoreComponent>,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.isUpdate = this.data.department ? true : false;
  }

  addAccount() {
    this.dialog
      .open(AddAccountComponent, {
        width: '600px',
        disableClose: true,
        autoFocus: false,
        data: <DepartmentReq>{
          department: this.data.department
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          console.log(res)
        }
      });
  }

}
