
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Account, ROLE } from 'src/app/account/account.component';
import { DepartmentReq } from '../department-store/department-store.component';

@Component({
  selector: 'add-account',
  templateUrl: './add-account.component.html',
  styleUrls: ['./add-account.component.scss']
})
export class AddAccountComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dataSource = new MatTableDataSource<Account>();
  readonly ROLE = ROLE;
  readonly displayedColumns = ['action', 'username', 'fullName', 'role'];
  listAccount: Account[] = [{
    username: 'quanghung', fullName: '123', department: 'academy', role: ROLE.admin
  },
  {
    username: 'hungquang', fullName: '234', department: 'academy', role: ROLE.management
  },
  {
    username: 'dasfdsa', fullName: '334', department: 'education', role: ROLE.management
  },
  {
    username: 'rewwewwew', fullName: '5454', department: 'education', role: ROLE.employee
  },
  {
    username: 'casdsfasdfa', fullName: '2323', department: 'academy', role: ROLE.employee
  },
  {
    username: 'casdcas3232', fullName: '3232', department: 'education', role: ROLE.admin
  },
  {
    username: 'cadscas3232', fullName: '545', department: 'academy', role: ROLE.management
  },
  {
    username: 'dgfgsdf232', fullName: '436', department: 'education', role: ROLE.admin
  },
  {
    username: 'dsdfas33', fullName: '45454', department: 'academy', role: ROLE.management
  },
  {
    username: 'dsdfas33', fullName: '45454', department: 'academy', role: ROLE.management
  },
  {
    username: 'dsdfas33', fullName: '45454', department: 'academy', role: ROLE.management
  },
]
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DepartmentReq,
    private dialogRef: MatDialogRef<AddAccountComponent>,
  ) {}

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<Account>(this.listAccount);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }

  checkout(e: Account) {

  }

}
