
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Account } from 'src/app/common/model/account';
import { AccountService } from 'src/app/common/service/account.service';
import { ToastService } from 'src/app/common/toast/service/toast.service';
import { AccountReq } from '../account-store/account-store.component';


@Component({
  selector: 'delete-account',
  templateUrl: './delete-account.component.html',
  styleUrls: ['./delete-account.component.scss']
})
export class DeleteAccountComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AccountReq,
    private dialogRef: MatDialogRef<DeleteAccountComponent>,
    private accountService: AccountService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
  }

  deleteAccount() {
    this.accountService.delete(this.data.account.id).subscribe(
      _=> {
      this.toastService.success('Delete successfully');
      this.dialogRef.close(true)
    },
      err => this.toastService.error('Delete failed')
    );
  }

}
