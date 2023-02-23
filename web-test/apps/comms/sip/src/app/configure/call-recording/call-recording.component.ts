import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CacheService, EventStreamService } from '../../shared';

declare let X: any;

@Component({
  selector: 'call-recording',
  templateUrl: './call-recording.component.html',
  styleUrls: ['./call-recording.component.scss']
})
export class CallRecordingComponent {
  loading = true;
  isSaving = false;
  currentAccount: any = {};
  recordIncoming: any = {
    record: false,
    msg: ''
  };
  recordOutgoing: any = {
    record: false,
    msg: ''
  };

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

  loadInfo(curAcc) {
    this.currentAccount = curAcc;
    this.recordIncoming.record = curAcc.incoming.callRecordingConfig.status === 'enabled';
    this.recordIncoming.msg = curAcc.incoming.callRecordingConfig.msg;
    this.recordOutgoing.record = curAcc.outgoing.callRecordingConfig.status === 'enabled';
    this.recordOutgoing.msg = curAcc.outgoing.callRecordingConfig.msg;
    this.loading = false;
  }

  saveChanges() {
    this.isSaving = true;
    forkJoin([
      this.http.put('/appsip/accounts/' + this.currentAccount.account.username + '/incoming', {
        action: 'updateCallRecording',
        data: {
          status: this.recordIncoming.record ? 'enabled' : 'disabled',
          msg: this.recordIncoming.msg
        }
      }),
      this.http.put('/appsip/accounts/' + this.currentAccount.account.username + '/outgoing', {
        action: 'updateCallRecording',
        data: {
          status: this.recordOutgoing.record ? 'enabled' : 'disabled',
          msg: this.recordOutgoing.msg
        }
      })
    ]).subscribe(
      ([res0, res1]) => {
        this.currentAccount.incoming = res0;
        this.currentAccount.outgoing = res1;
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

  showCustomStorageConfig() {
    this.eventStreamService.trigger('open-modal', 'call-recording-custom-storage-modal');
  }
}
