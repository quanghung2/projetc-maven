
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Department } from 'src/app/common/model/department';
import { DepartmentService } from 'src/app/common/service/department.service';
import { ToastService } from 'src/app/common/toast/service/toast.service';
import { AddAccountComponent } from '../add-account/add-account.component';

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
  name = new FormControl(null, Validators.required);
  type = new FormControl(null, Validators.required);


  readonly TYPE = [
    { key: 'DEV', value: 'DEV' },
    { key: 'TEST', value: 'TEST' },
    { key: 'ScrumMaster', value: 'SCRUMMASTER' }, 
    { key: 'PM', value: 'PM' }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DepartmentReq,
    private dialogRef: MatDialogRef<DepartmentStoreComponent>,
    private dialog: MatDialog,
    private departmentService: DepartmentService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.isUpdate = this.data.department ? true : false;
    if(this.isUpdate) {
      this.name.setValue(this.data.department.name);
      this.type.setValue(this.data.department.type);
    }
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

  saveOrUpdate() {
    if(this.isUpdate) {
      const body = {
        name: this.name.value,
        type: this.type.value
      }
      this.departmentService.update(body, this.data.department.id).subscribe(
        _=> {
        this.toastService.success('Updated successfully');
        this.dialogRef.close(true)
      },
        err => this.toastService.error('Update failed')
      );
    } else {
      const body = {
        name: this.name.value,
        type: this.type.value
      }
      this.departmentService.create(body).subscribe(_=> {
        this.toastService.success('Create successfully');
        this.dialogRef.close(true)
      },
      err => this.toastService.error('Create failed')
      );
    }
  }

}
