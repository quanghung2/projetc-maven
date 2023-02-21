
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Account } from 'src/app/common/model/account';
import { DepartmentReq } from '../department-store/department-store.component';

@Component({
  selector: 'add-account',
  templateUrl: './add-account.component.html',
  styleUrls: ['./add-account.component.scss']
})
export class AddAccountComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dataSource = new MatTableDataSource<Account>();
  readonly displayedColumns = ['username', 'fullName', 'role', 'action'];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DepartmentReq,
    private dialogRef: MatDialogRef<AddAccountComponent>,
  ) {}

  ngOnInit(): void {
    // this.dataSource = new MatTableDataSource<Account>(this.listAccount);
    // setTimeout(() => {
    //   this.dataSource.paginator = this.paginator;
    // });
  }

  checkout(e: Account) {

  }

}
