import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DestroySubscriberComponent } from '../common/destroy-subscriber.component';
import { AccountReq, AccountStoreComponent } from './account-store/account-store.component';
import { DeleteAccountComponent } from './delete-account/delete-account.component';
export enum ROLE {
  admin = 'admin',
  employee = 'employee',
  management = 'management'

}
export interface Account {
  username: string;
  fullName: string;
  role: ROLE;
  department: string;
}
@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dataSource = new MatTableDataSource<Account>();
  readonly ROLE = ROLE;
  readonly displayedColumns = ['username', 'fullName', 'role', 'department', 'actions'];

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

  constructor(private dialog: MatDialog,) {
    super()
  }

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<Account>(this.listAccount);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }

  deleteAccount(account: Account) {
    this.dialog
      .open(DeleteAccountComponent, {
        width: '450px',
        disableClose: true,
        autoFocus: false,
        data: <AccountReq>{
          account: account
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.refresh();
        }
      });
  }

  updateOrCreate(account?: Account) {
    this.dialog
      .open(AccountStoreComponent, {
        width: '500px',
        disableClose: true,
        autoFocus: false,
        data: <AccountReq>{
          account: account
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.refresh();
        }
      });
  }

  refresh() {

  }

}
