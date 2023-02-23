import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CacheService, EventStreamService } from '../../shared';

declare var X: any;

@Component({
  selector: 'ip-white-list',
  templateUrl: './ip-white-list.component.html',
  styleUrls: ['./ip-white-list.component.scss']
})
export class IPWhiteListComponent {
  loading = true;
  isAdding = false;
  isRemoving = false;
  currentAccount: any = {};
  ipAddress: string;

  constructor(
    private http: HttpClient,
    private eventStreamService: EventStreamService,
    private cacheService: CacheService
  ) {
    const cur = this.cacheService.get('current-account');
    if (cur) {
      this.loadInfo(cur);
    }

    this.eventStreamService.on('switched-account').subscribe(res => {
      this.loadInfo(res);
    });
  }

  loadInfo(curAcc) {
    this.currentAccount = curAcc;
    this.loading = false;
  }

  add() {
    this.isAdding = true;
    this.http
      .put('/appsip/accounts/' + this.currentAccount.account.username, {
        action: 'addIpWhiteList',
        data: {
          ips: [this.ipAddress]
        }
      })
      .subscribe(
        res => {
          this.currentAccount.account = res;
          this.cacheService.put('current-account', this.currentAccount);
          this.isAdding = false;
          X.showSuccess('Your setting has been updated successfully.');
        },
        err => {
          this.isAdding = false;
          X.showWarn('Cannot update your setting. Please check your input.');
        }
      );
  }

  remove(index) {
    this.isRemoving = true;
    this.http
      .put('/appsip/accounts/' + this.currentAccount.account.username, {
        action: 'removeIpWhiteList',
        data: {
          ip: this.currentAccount.account.config.ipWhiteList[index]
        }
      })
      .subscribe(
        res => {
          this.currentAccount.account = res;
          this.cacheService.put('current-account', this.currentAccount);
          this.isRemoving = false;
          X.showSuccess('Your setting has been updated successfully.');
        },
        err => {
          this.isRemoving = false;
          X.showWarn('Cannot update your setting. Please check your input.');
        }
      );
  }
}
