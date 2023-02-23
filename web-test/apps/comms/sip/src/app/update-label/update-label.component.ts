import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CacheService, EventStreamService } from '../shared';

declare var X: any;

@Component({
  selector: 'update-label',
  templateUrl: './update-label.component.html',
  styleUrls: ['./update-label.component.scss']
})
export class UpdateLabelComponent {
  updating = false;
  label: string;
  accountList: any = {};
  currentAccount: any = {};

  constructor(
    private http: HttpClient,
    private eventStreamService: EventStreamService,
    private cacheService: CacheService
  ) {
    this.eventStreamService.on('show-update-label').subscribe(res => {
      this.accountList = this.cacheService.get('account-list');
      this.currentAccount = this.cacheService.get('current-account');
      this.label = this.currentAccount.account.label;
      this.eventStreamService.trigger('open-popup', 'update-label-popup');
    });
  }

  updateLabel(event) {
    event.stopPropagation();
    this.eventStreamService.trigger('show-update-label', {});
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  submit() {
    this.updating = true;
    this.http
      .put('/appsip/accounts/' + this.currentAccount.account.username, {
        action: 'updateLabel',
        data: {
          label: this.label
        }
      })
      .subscribe(
        res => {
          this.accountList
            .filter(ac => ac.sipUsername === this.currentAccount.account.username)
            .forEach(ac => {
              ac.tag = this.label;
            });
          this.updating = false;
          this.eventStreamService.trigger('close-popup', 'update-label-popup');
          X.showSuccess('Your setting has been updated successfully.');
        },
        err => {
          this.updating = false;
          this.eventStreamService.trigger('close-popup', 'update-label-popup');
          X.showWarn('Cannot update your setting. Please check your input.');
        }
      );
  }
}
