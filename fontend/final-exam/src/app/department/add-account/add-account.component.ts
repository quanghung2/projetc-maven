
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Account } from 'src/app/common/model/account';
import { AccountService } from 'src/app/common/service/account.service';
import { DepartmentReq } from '../department-store/department-store.component';
import { startWith, takeUntil, finalize } from 'rxjs/operators';

@Component({
  selector: 'add-account',
  templateUrl: './add-account.component.html',
  styleUrls: ['./add-account.component.scss']
})
export class AddAccountComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  loading: boolean;
  dataSource: MatTableDataSource<Account> = new MatTableDataSource<Account>();
  accounts: Account[] = [];
  readonly displayedColumns = ['username', 'fullName', 'role', 'action'];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DepartmentReq,
    private dialogRef: MatDialogRef<AddAccountComponent>,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.accountService.getAll()
    .pipe(finalize(() => (this.loading = false)))
    .subscribe(page => {
      this.accounts = page.content;
      this.updateDataSource(this.accounts)
    })
  }

  updateDataSource(items: Account[]) {
    this.dataSource.data = items;
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }

  checkout(e: Account) {

  }

}
