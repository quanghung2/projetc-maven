import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CacheService, EventStreamService } from '../../shared';

declare var X: any;

@Component({
  selector: 'compliance-list',
  templateUrl: './compliance.component.html',
  styleUrls: ['./compliance.component.scss']
})
export class ComplianceComponent {
  loading = true;
  isSaving = false;
  currentAccount: any = {};
  action: string;
  remark: string;

  constructor(
    private http: HttpClient,
    private eventStreamService: EventStreamService,
    private cacheService: CacheService
  ) {
    const cur = this.cacheService.get('current-account');
    if (cur) {
      this.loadInfo(cur);
    }

    this.eventStreamService.on('switch-account').subscribe(res => {
      this.loading = true;
    });

    this.eventStreamService.on('switched-account').subscribe(res => {
      this.loadInfo(res);
    });
  }

  private loadInfo(curAcc) {
    this.currentAccount = curAcc;
    this.action = curAcc.outgoing.complianceConfig.action;
    this.remark = curAcc.outgoing.complianceConfig.remark;
    this.loading = false;
  }

  saveChanges() {
    this.isSaving = true;
    this.http
      .put('/appsip/accounts/' + this.currentAccount.account.username + '/outgoing', {
        action: 'updateCompliance',
        data: {
          action: this.action,
          remark: this.remark
        }
      })
      .subscribe(
        res => {
          this.currentAccount.outgoing = res;
          this.cacheService.put('current-account', this.currentAccount);
          this.isSaving = false;
          X.showSuccess('Your setting has been updated successfully.');
        },
        err => {
          this.isSaving = false;
          X.showWarn('Cannot update your setting. Please check your input.');
        }
      );
  }
}
