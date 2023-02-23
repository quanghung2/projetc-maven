import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CacheService, EventStreamService } from '../../shared';
import { User } from '../../shared/model/user.model';

declare var X: any;

@Component({
  selector: 'connected-devices',
  templateUrl: './connected-devices.component.html',
  styleUrls: ['./connected-devices.component.scss']
})
export class ConnectedDevicesComponent {
  loading = true;
  isRefreshing = false;
  currentAccount: any = {};
  connectedDevices: any = [];
  user: User;

  constructor(
    private http: HttpClient,
    private eventStreamService: EventStreamService,
    private cacheService: CacheService
  ) {
    const user = this.cacheService.get('user-info');
    if (user) {
      this.user = user;
    }

    const cur = this.cacheService.get('current-account');
    if (cur) {
      this.loadInfo(cur);
      this.refresh();
    }

    this.eventStreamService.on('switched-account').subscribe(res => {
      this.loadInfo(res);
      this.refresh();
    });
  }

  loadInfo(curAcc) {
    this.currentAccount = curAcc;
    this.loading = false;
  }

  refresh() {
    this.isRefreshing = true;
    this.http.get('/appsip/accounts/' + this.currentAccount.account.username + '/connected-devices').subscribe(
      res => {
        this.connectedDevices = res;
        this.isRefreshing = false;
      },
      err => {
        this.isRefreshing = false;
      }
    );
  }
}
