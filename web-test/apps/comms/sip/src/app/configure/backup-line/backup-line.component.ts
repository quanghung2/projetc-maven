import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CacheService, EventStreamService } from '../../shared';

declare let X: any;

@Component({
  selector: 'backup-line',
  templateUrl: './backup-line.component.html',
  styleUrls: ['./backup-line.component.scss']
})
export class BackupLineComponent {
  loading = true;
  isSaving = false;
  currentAccount: any = {};
  active = false;
  customize = false;
  backupNumbers: any = [];
  defaultBackupNumber: string;
  selectedFailOver = 'auto';
  sipAccount2 = '';
  accounts: any;

  constructor(
    private http: HttpClient,
    private eventStreamService: EventStreamService,
    private cacheService: CacheService
  ) {
    const cur = this.cacheService.get('current-account');
    const acc = this.cacheService.get('account-list');
    if (cur) {
      this.loadInfo(cur);
    }
    if (acc) {
      this.load2ndAccountLst(acc);
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
    this.active = curAcc.incoming.incomingRedirectConfig.strategy === 'backupNumber';
    this.sipAccount2 = this.currentAccount.incoming.failOverEndpoints
      ? this.currentAccount.incoming.failOverEndpoints[0]
      : '';
    this.selectedFailOver = this.currentAccount.incoming.failOverEndpoints ? 'auto' : 'manual';
    if (this.active) {
      for (const did in curAcc.incoming.incomingRedirectConfig.backupNumbers) {
        if (!curAcc.incoming.incomingRedirectConfig.backupNumbers.hasOwnProperty(did)) {
          continue;
        }
        this.backupNumbers.push({ did: did, backup: curAcc.incoming.incomingRedirectConfig.backupNumbers[did] });
      }
      if (this.backupNumbers.length > 0) {
        this.customize = true;
      }
      this.defaultBackupNumber = curAcc.incoming.incomingRedirectConfig.defaultBackupNumber;
    }
    this.loading = false;
  }

  load2ndAccountLst(acc) {
    this.accounts = [];
    if (acc.length > 0) {
      acc.forEach(item => {
        if (item.sipUsername !== this.currentAccount.incoming.sipUsername) {
          this.accounts.push(item);
        }
      });
    }
  }

  customizeIt() {
    this.backupNumbers = [];
    this.currentAccount.account.numbers.forEach(did => {
      this.backupNumbers.push({ did: did, backup: '' });
    });
    this.customize = true;
  }

  removeBackupNumber(index) {
    this.backupNumbers.splice(index, 1);
    if (this.backupNumbers.length === 0) {
      this.customize = false;
    }
  }

  addBackupNumber() {
    this.backupNumbers.push({ did: '', backup: '' });
  }

  saveChanges() {
    this.isSaving = true;
    let data: any = {};
    if (this.selectedFailOver == 'manual') {
      if (this.active) {
        data = {
          defaultBackupNumber: this.defaultBackupNumber,
          backupNumbers: {},
          strategy: 'backupNumber'
        };
        this.backupNumbers.forEach(backupNumber => {
          data.backupNumbers[backupNumber.did] = backupNumber.backup;
        });
      } else {
        data = {
          sipDomain: this.currentAccount.account.domain,
          sipUsername: this.currentAccount.account.username,
          strategy: 'sipEndpoint'
        };
      }
    } else {
      data = {
        sipDomain: this.currentAccount.account.domain,
        sipUsername: this.currentAccount.account.username,
        strategy: 'sipEndpoint',
        failOverEndpoints: [this.sipAccount2]
      };
    }
    this.http
      .put('/appsip/accounts/' + this.currentAccount.account.username + '/incoming', {
        action: 'updateIncomingRedirect',
        data: data
      })
      .subscribe(
        res => {
          this.currentAccount.incoming = res;
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
