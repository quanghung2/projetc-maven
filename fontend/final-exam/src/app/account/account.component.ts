import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DestroySubscriberComponent } from '../common/destroy-subscriber.component';
import { Account } from '../common/model/account';
import { AccountService } from '../common/service/account.service';
import { AccountReq, AccountStoreComponent } from './account-store/account-store.component';
import { DeleteAccountComponent } from './delete-account/delete-account.component';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dataSource = new MatTableDataSource<Account>();
  readonly displayedColumns = ['username', 'fullName', 'role', 'department', 'actions'];

  constructor(private dialog: MatDialog, private accountService: AccountService) {
    super()
  }

  ngOnInit(): void {
    this.accountService.getAll().subscribe(page => {
      this.dataSource = new MatTableDataSource<Account>(page.content);
      console.log(page.content)
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
    })
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
