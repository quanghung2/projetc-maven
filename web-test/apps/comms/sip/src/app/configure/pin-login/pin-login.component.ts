import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CacheService, EventStreamService } from '../../shared';

declare var X: any;

@Component({
  selector: 'app-pin-login',
  templateUrl: './pin-login.component.html',
  styleUrls: ['./pin-login.component.scss']
})
export class PinLoginComponent implements OnInit {
  public loading = false;
  public enable: boolean;
  public number: string;
  public status = 'enabled';
  public currentAccount: any = {};
  public configs: PinLogin[] = [];

  constructor(
    private http: HttpClient,
    private eventStreamService: EventStreamService,
    private cacheService: CacheService
  ) {}

  ngOnInit() {
    const cur = this.cacheService.get('current-account');
    if (cur) {
      this.loadInfo(cur);
    }

    this.eventStreamService.on('switched-account').subscribe(res => {
      this.loadInfo(res);
    });
  }

  private loadInfo(curAcc) {
    this.loading = true;
    this.currentAccount = curAcc;

    this.http.get<any>('/appsip/accounts/' + this.currentAccount.account.username + '/outgoing').subscribe(res => {
      this.enable = res.pinLoginConfig ? res.pinLoginConfig.status === 'enabled' : false;
    });

    this.http.get<any>('/appsip/pinLogin/' + this.currentAccount.account.username).subscribe(
      res => {
        this.configs = res;
        this.loading = false;
      },
      err => {
        X.showWarn('Cannot load account');
        this.loading = false;
      }
    );
  }

  enablePinLogin(event: any) {
    this.enable = event.target.checked;
    this.loading = true;
    const payload = {
      action: 'updatePinLogin',
      data: {
        status: this.enable ? 'enabled' : 'disabled'
      }
    };

    forkJoin([
      this.http.put('/appsip/accounts/' + this.currentAccount.account.username + '/incoming', payload),
      this.http.put('/appsip/accounts/' + this.currentAccount.account.username + '/outgoing', payload)
    ]).subscribe(
      res => {
        X.showSuccess('Pin login config updated');
        this.loading = false;
      },
      err => {
        X.showWarn('Cannot update pin login');
        this.loading = false;
      }
    );
  }

  add() {
    this.loading = true;
    this.http
      .put(`/appsip/pinLogin/${this.currentAccount.account.username}/${this.number}`, {
        status: this.status
      })
      .subscribe(
        res => {
          this.loading = false;
          this.number = '';
          this.loadInfo(this.currentAccount);
          X.showSuccess('Add number successfully');
        },
        err => {
          this.loading = false;
          X.showWarn('Add number failed');
        }
      );
  }

  update(config: PinLogin) {
    this.loading = true;
    this.http
      .put(`/appsip/pinLogin/${config['pin_login.sip_username']}/${config['pin_login.did']}`, {
        status: config['pin_login.status'] === 'enabled' ? 'disabled' : 'enabled'
      })
      .subscribe(
        res => {
          this.loading = false;
          this.loadInfo(this.currentAccount);
          X.showSuccess('Update status successfully');
        },
        err => {
          this.loading = false;
          X.showWarn('Update status failed');
        }
      );
  }

  delete(config: PinLogin) {
    this.loading = true;
    this.http.delete(`/appsip/pinLogin/${config['pin_login.sip_username']}/${config['pin_login.did']}`).subscribe(
      res => {
        this.loading = false;
        this.loadInfo(this.currentAccount);
        X.showSuccess('Delete number successfully');
      },
      err => {
        this.loading = false;
        X.showWarn('Delete number failed');
      }
    );
  }
}

export class PinLogin {
  'pin_login.sip_username': string;
  'pin_login.did': string;
  'pin_login.status': string;
}
