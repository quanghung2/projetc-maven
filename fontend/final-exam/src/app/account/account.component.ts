import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DestroySubscriberComponent } from '../common/destroy-subscriber.component';
import { Account } from '../common/model/account';
import { AccountService } from '../common/service/account.service';
import { AccountReq, AccountStoreComponent } from './account-store/account-store.component';
import { DeleteAccountComponent } from './delete-account/delete-account.component';
import { startWith, takeUntil, finalize } from 'rxjs/operators';
@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  searchCtrl = new FormControl();
  dataSource: MatTableDataSource<Account> = new MatTableDataSource<Account>();
  data: Account[] = [];
  loading: boolean;
  filteredRole = '';
  filteredDepartment = '';
  readonly displayedColumns = ['username', 'fullName', 'role', 'department', 'actions'];
  readonly ROLE = [
    { key: 'USER', value: 'USER' },
    { key: 'MANAGER', value: 'MANAGER' },
    { key: 'ADMIN', value: 'ADMIN' },
  ];

  constructor(
    private dialog: MatDialog, 
    private accountService: AccountService,
    private fb: FormBuilder) {
    super()
  }

  ngOnInit(): void {
    this.loading = true
    this.accountService.getAll()
    .pipe(finalize(() => (this.loading = false)))
    .subscribe(page => {
      this.data = page.content;
      if (!this.searchCtrl.value) {
        this.updateDataSource(this.data);
      } else {
        const data = this.data.filter(
          x =>
            x.username?.toLowerCase().includes(this.searchCtrl.value?.trim()?.toLowerCase()) ||
            x.firstName?.toLowerCase().includes(this.searchCtrl.value?.trim()?.toLowerCase()) ||
            x.lastName?.toLowerCase().includes(this.searchCtrl.value?.trim()?.toLowerCase())
        );
        this.updateDataSource(data);
      }
    });
    this.initSearch()
  }

  initSearch() {
    this.searchCtrl.valueChanges.pipe(startWith(''), takeUntil(this.destroySubscriber$)).subscribe(value => {
      if (!value?.trim()) {
        this.updateDataSource(this.data);
        return;
      }
      const data = this.data.filter(
        x =>
        x.username?.toLowerCase().includes(this.searchCtrl.value?.trim()?.toLowerCase()) ||
        x.firstName?.toLowerCase().includes(this.searchCtrl.value?.trim()?.toLowerCase()) ||
        x.lastName?.toLowerCase().includes(this.searchCtrl.value?.trim()?.toLowerCase())
      );
      this.updateDataSource(data);
    })
  }

  onChangeRole(event: any) {
    const filterValue = event.toString() || '';
    const accounts = this.data.filter(q => filterValue === q.role);
    this.updateDataSource(accounts);
  }

  updateDataSource(items: Account[]) {
    this.dataSource.data = items;
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
    this.loading = true;
    this.filteredRole = '';
    this.filteredDepartment = '';
    this.searchCtrl.setValue('')
    this.accountService
      .getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(page => {
        this.data = page.content;
        this.updateDataSource(this.data)
      })
  }

}
