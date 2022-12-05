
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Account, AccountComponent } from '../account.component';

export interface AccountReq {
  account: Account
}

@Component({
  selector: 'delete-account',
  templateUrl: './delete-account.component.html',
  styleUrls: ['./delete-account.component.scss']
})
export class DeleteAccountComponent implements OnInit {
  isUpdate: boolean;
  username = new FormControl(null, Validators.required);
  firstName = new FormControl(null, Validators.required);
  lastName = new FormControl(null, Validators.required);
  role = new FormControl(null, Validators.required);
  department = new FormControl(null, Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AccountReq,
    private dialogRef: MatDialogRef<DeleteAccountComponent>,
  ) {}

  ngOnInit(): void {
    this.isUpdate = this.data.account ? true : false;
  }

}
