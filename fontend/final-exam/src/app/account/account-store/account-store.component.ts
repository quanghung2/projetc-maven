
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Account } from 'src/app/common/model/account';
import { AccountService } from 'src/app/common/service/account.service';
import { ToastService } from 'src/app/common/toast/service/toast.service';

export interface AccountReq {
  account: Account
}

@Component({
  selector: 'account-store',
  templateUrl: './account-store.component.html',
  styleUrls: ['./account-store.component.scss']
})
export class AccountStoreComponent implements OnInit {
  isUpdate: boolean;
  username = new FormControl(null, Validators.required);
  firstName = new FormControl(null, Validators.required);
  lastName = new FormControl(null, Validators.required);
  role = new FormControl(null, Validators.required);
  department = new FormControl(null, Validators.required);
  readonly ROLE = [
    { key: 'USER', value: 'USER' },
    { key: 'MANAGER', value: 'MANAGER' },
    { key: 'ADMIN', value: 'ADMIN' },
  ];
  readonly departmentList= [
    {key: 1, value: 'Marketing'}, 
    {key: 2, value: 'Sale'}, 
    {key: 3, value: 'Bảo vệ'}, 
    {key: 4, value: 'Nhân sự'}, 
    {key: 5, value: 'Kỹ thuật'}, 
    {key: 6, value: 'Tài chính'},
    {key: 7, value: 'Phó giám đốc'},
    {key: 8, value: 'Giám đốc'},
    {key: 9, value: 'Thư kí'},
    {key: 10, value: 'Bán hàng'},
  ]

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AccountReq,
    private dialogRef: MatDialogRef<AccountStoreComponent>,
    private accountService: AccountService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.isUpdate = this.data.account ? true : false;
    if(this.isUpdate) {
      this.username.setValue(this.data.account.username);
      this.firstName.setValue(this.data.account.firstName);
      this.lastName.setValue(this.data.account.lastName);
      this.role.setValue(this.data.account.role);
      this.department.setValue(this.data.account.departmentId);
    }
  }

  saveOrUpdate() {
    if(this.isUpdate) {
      const body = {
        username: this.username.value,
        firstName: this.firstName.value,
        lastName: this.lastName.value,
        role: this.role.value,
        departmentId: this.department.value
      }
      this.accountService.update(body, this.data.account.id).subscribe(
        _=> {
        this.toastService.success('Updated successfully');
        this.dialogRef.close(true)
      },
        err => this.toastService.error('Update failed')
      );
    } else {
      const body = {
        username: this.username.value,
        firstName: this.firstName.value,
        lastName: this.lastName.value,
        role: this.role.value,
        departmentId: this.department.value
      }
      this.accountService.create(body).subscribe(_=> {
        this.toastService.success('Create successfully');
        this.dialogRef.close(true)
      },
      err => this.toastService.error('Create failed')
      );
    }
  }

}
