import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { CacheService, EventStreamService } from '../../shared';
import { AccountAdvanceModalInput } from '../account-advance-modal/account-advance-modal.component';
import {
  sip1,
  sip1b3networks,
  sip2,
  sip2b3,
  sip3,
  sip3b3,
  sip5b3,
  sip6b3,
  sip8b3,
  sipbiz,
  sipmy,
  sipsg,
  siptestb3,
  siptls,
  siptrunk
} from './pbx-config';

export class User {
  appId: string;
  availableCallerIds: string[];
  chargeableOrgUuid: string;
  deviceUuid: string;
  displayName: string;
  domain: string;
  email: string;
  identityUuid: string;
  mobileNumber: string;
  orgName: string;
  orgUuid: string;
  role: string;
  timeFormat: string;
  timezone: string;
  uuid: string;
  walletCurrencyCode: string;
  walletUuid: string;

  constructor(obj?) {
    Object.assign(this, obj);
  }

  get timezoneOffset(): string {
    return this.timezone.substr(3, 5) || '+0800';
  }
}

export interface CapacityUpdate {
  action: string;
  data: CapacityData;
}

export interface SipTypeUpdate {
  type: string;
}

export interface CapacityData {
  capacity: string;
}

declare var X: any;

@Component({
  selector: 'account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.scss']
})
export class AccountInfoComponent {
  loading = true;
  isUpdatingDefaultCallerId = false;
  isResettingPassword = false;
  isUpdatingIpPeer = false;
  isGettingTLSKey = false;
  userInfo: any = {};
  currentAccount: any = {};
  pbxConfig: any = {};
  subSipDomain: any = {};
  useSipNumber = false;
  usePBXSetting = false;
  editingIpPeer = false;
  availableCallerIds: any = [];
  ipPeer = '';
  tlsKey = '';
  selectedCapacity: string;
  selectedSipGateWay: string;
  handleIsdnIncoming: boolean;

  accountAdvance: AccountAdvanceModalInput;

  isShowAdvanceModal: boolean;
  isShopModalConfirmUpdate: boolean;
  selectedProtocol: string;
  selectedPort: string;

  constructor(
    private http: HttpClient,
    private eventStreamService: EventStreamService,
    private cacheService: CacheService,
    private cdr: ChangeDetectorRef
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

    this.eventStreamService.on('account-info:reset-password').subscribe(e => {
      this.isResettingPassword = true;
      this.http
        .put('/appsip/accounts/' + this.currentAccount.account.username, {
          action: 'resetPassword',
          data: {}
        })
        .subscribe(
          res => {
            this.currentAccount.account = res;
            this.cacheService.put('current-account', this.currentAccount);
            this.isResettingPassword = false;
            this.eventStreamService.trigger('hide-confirmation', {});
            X.showSuccess('Your setting has been updated successfully.');
          },
          err => {
            this.isResettingPassword = false;
            this.eventStreamService.trigger('hide-confirmation', {});
            X.showWarn('Cannot update your setting. Please check your input.');
          }
        );
    });
  }

  loadInfo(curAcc) {
    this.userInfo = this.cacheService.get('user-info');
    this.currentAccount = curAcc;
    if (this.currentAccount && this.currentAccount.account) {
      this.selectedCapacity = this.currentAccount.account['capacity'] || 'voice';
      this.handleIsdnIncoming = this.currentAccount.account['handleIsdnIncoming'];
      this.selectedSipGateWay = this.currentAccount.type;
      if (curAcc.account.domain.indexOf('sip1') === 0) {
        if (curAcc.account.domain.indexOf('b3networks') !== -1) {
          this.pbxConfig = sip1b3networks;
        } else {
          this.pbxConfig = sip1;
        }
        this.subSipDomain = 'sip1';
      } else if (curAcc.account.domain.indexOf('sip2') === 0) {
        if (curAcc.account.domain.indexOf('b3networks') !== -1) {
          this.pbxConfig = sip2b3;
        } else {
          this.pbxConfig = sip2;
        }
        this.subSipDomain = 'sip2';
      } else if (curAcc.account.domain.indexOf('sip3') === 0) {
        if (curAcc.account.domain.indexOf('b3networks') !== -1) {
          this.pbxConfig = sip3b3;
        } else {
          this.pbxConfig = sip3;
        }
        this.subSipDomain = 'sip3';
      } else if (curAcc.account.domain.indexOf('sip5') === 0) {
        if (curAcc.account.domain.indexOf('b3networks') !== -1) {
          this.pbxConfig = sip5b3;
        }
      } else if (curAcc.account.domain.indexOf('sip6') === 0) {
        if (curAcc.account.domain.indexOf('b3networks') !== -1) {
          this.pbxConfig = sip6b3;
        }
      } else if (curAcc.account.domain.indexOf('sip8') === 0) {
        if (curAcc.account.domain.indexOf('b3networks') !== -1) {
          this.pbxConfig = sip8b3;
        }
      } else if (curAcc.account.domain.indexOf('siptest') === 0) {
        this.pbxConfig = siptestb3;
        this.subSipDomain = 'siptest';
      } else if (curAcc.account.domain.indexOf('sipbiz') === 0) {
        this.pbxConfig = sipbiz;
        this.subSipDomain = 'sipbiz';
      } else if (curAcc.account.domain.indexOf('sipmy') === 0) {
        this.pbxConfig = sipmy;
        this.subSipDomain = 'sipmy';
      } else if (curAcc.account.domain.indexOf('sipsg') === 0) {
        this.pbxConfig = sipsg;
        this.subSipDomain = 'sipsg';
      } else if (curAcc.account.domain.indexOf('siptls') === 0) {
        this.pbxConfig = siptls;
        this.subSipDomain = 'siptls';
      } else if (curAcc.account.domain.indexOf('siptrunk') === 0) {
        this.pbxConfig = siptrunk;
        this.subSipDomain = 'siptrunk';
      }
      this.useSipNumber = false;
      this.usePBXSetting = false;
      curAcc.outgoing.callerIdConfig.determineCliStrategies.forEach(strategy => {
        if (strategy === 'SipNumber') {
          this.useSipNumber = true;
        } else if (strategy === 'PbxSetting') {
          this.usePBXSetting = true;
        }
      });
      this.ipPeer = '';
      curAcc.account.config.ipPeers.forEach(peer => {
        if (peer.handleIncomingCall) {
          this.ipPeer = peer.ip;
          this.selectedProtocol = peer.protocol;
          this.selectedPort = peer.port;
        }
      });
      curAcc.availableCallerIds.forEach(cli => {
        if (cli.match(/^\+?\d+$/g)) {
          this.availableCallerIds.push(cli);
        }
      });
    }
    this.loading = false;
  }

  showAdvancedConfiguration() {
    this.isShowAdvanceModal = true;
    this.cdr.detectChanges();
    this.eventStreamService.trigger('open-popup-advanced-configuration', <AccountAdvanceModalInput>{
      selectedCapacity: this.selectedCapacity,
      selectedSipGateWay: this.selectedSipGateWay,
      handleIsdnIncoming: this.handleIsdnIncoming
    });
  }

  closeModalAdvance() {
    this.isShowAdvanceModal = false;
  }

  showCliRules(event) {
    this.eventStreamService.trigger('open-popup', 'show-cli-rule-popup');
    event.stopImmediatePropagation();
    this.eventStreamService.trigger('open-popup', 'show-cli-rule-popup');
  }

  updateCallerId(callerId) {
    this.isUpdatingDefaultCallerId = true;
    let caller;
    if (callerId === 'sipnumber') {
      this.useSipNumber = true;
      this.usePBXSetting = false;
      caller = this.http.put('/appsip/accounts/' + this.currentAccount.account.username + '/outgoing', {
        action: 'updateCallerId',
        data: {
          strategy: 'SipNumber'
        }
      });
    } else if (callerId === 'pbxsetting') {
      this.useSipNumber = false;
      this.usePBXSetting = true;
      caller = this.http.put('/appsip/accounts/' + this.currentAccount.account.username + '/outgoing', {
        action: 'updateCallerId',
        data: {
          strategy: 'PbxSetting'
        }
      });
    } else {
      this.useSipNumber = false;
      this.usePBXSetting = false;
      caller = this.http.put('/appsip/accounts/' + this.currentAccount.account.username + '/outgoing', {
        action: 'updateCallerId',
        data: {
          strategy: 'DefaultCli',
          defaultCli: callerId
        }
      });
    }
    caller.subscribe(
      res => {
        this.currentAccount.outgoing = res;
        this.cacheService.put('current-account', this.currentAccount);
        this.isUpdatingDefaultCallerId = false;
        X.showSuccess('Your setting has been updated successfully.');
      },
      err => {
        this.isUpdatingDefaultCallerId = false;
        X.showWarn('Cannot update your setting. Please check your input.');
      }
    );
  }

  updateDefaultCallerId(callerId) {
    this.isUpdatingDefaultCallerId = true;
    let caller;
    if (this.useSipNumber) {
      caller = this.http.put('/appsip/accounts/' + this.currentAccount.account.username + '/outgoing', {
        action: 'updateCallerId',
        data: {
          strategy: 'SipNumber',
          defaultCli: callerId
        }
      });
    } else if (this.usePBXSetting) {
      caller = this.http.put('/appsip/accounts/' + this.currentAccount.account.username + '/outgoing', {
        action: 'updateCallerId',
        data: {
          strategy: 'PbxSetting',
          defaultCli: callerId
        }
      });
    } else {
      caller = this.http.put('/appsip/accounts/' + this.currentAccount.account.username + '/outgoing', {
        action: 'updateCallerId',
        data: {
          strategy: 'DefaultCli',
          defaultCli: callerId
        }
      });
    }
    caller.subscribe(
      res => {
        this.currentAccount.outgoing = res;
        this.cacheService.put('current-account', this.currentAccount);
        this.isUpdatingDefaultCallerId = false;
        X.showSuccess('Your setting has been updated successfully.');
      },
      err => {
        this.isUpdatingDefaultCallerId = false;
        X.showWarn('Cannot update your setting. Please check your input.');
      }
    );
  }

  resetPassword() {
    this.eventStreamService.trigger('show-confirmation', {
      title: 'Reset Password',
      message: `Are you sure you want to reset password sip ${this.currentAccount.account.username}?`,
      type: 'yesno',
      okEvent: {
        event: 'account-info:reset-password',
        data: {
          sipUsername: this.currentAccount.account.username
        }
      },
      cancelEvent: {}
    });
  }

  updateIpPeer() {
    this.isUpdatingIpPeer = true;
    this.http
      .put('/appsip/accounts/' + this.currentAccount.account.username, {
        action: 'updateIpPeer',
        data: {
          ip: this.ipPeer,
          protocol: this.selectedProtocol,
          port: this.selectedPort
        }
      })
      .subscribe(
        res => {
          this.currentAccount.account = res;
          this.cacheService.put('current-account', this.currentAccount);
          this.isUpdatingIpPeer = false;
          this.editingIpPeer = false;
          X.showSuccess('Your setting has been updated successfully.');
        },
        err => {
          this.isUpdatingIpPeer = false;
          X.showWarn('Cannot update your setting. Please check your input.');
        }
      );
  }

  getTLSKey() {
    this.isGettingTLSKey = true;
    this.http.get('/appsip/accounts/' + this.currentAccount.account.username + '/tls-key').subscribe(
      res => {
        this.isGettingTLSKey = false;
        this.tlsKey = res['keyUrl'];
      },
      err => {
        this.isGettingTLSKey = false;
        this.isUpdatingIpPeer = false;
        X.showWarn('Cannot get tls certificate.');
      }
    );
  }

  updateCapacity() {
    const sipUserName = this.currentAccount.account['username'];
    const data = { capacity: this.selectedCapacity } as CapacityData;
    const bodyRequest = { action: 'updateCapacity', data: data } as CapacityUpdate;
    this.http.put(`appsip/accounts/${sipUserName}`, bodyRequest).subscribe(
      _ => {
        X.showSuccess('Your setting has been updated successfully.');
      },
      error => {
        X.showWarn(error.message);
        this.selectedCapacity = this.currentAccount.account['capacity'] || 'voice';
      }
    );
  }

  updateSipType() {
    const sipUserName = this.currentAccount.account['username'];
    const bodyRequest = { type: this.selectedSipGateWay } as SipTypeUpdate;
    this.http.put(`appsip/accounts/${sipUserName}/type`, bodyRequest).subscribe(
      resp => {
        X.showSuccess('Your setting has been updated successfully.');
      },
      error => {
        X.showWarn(error.message);
        this.selectedSipGateWay = this.currentAccount.type;
      }
    );
  }

  updateISDN() {
    const sipUserName = this.currentAccount.account['username'];
    const data = { handleIsdnIncoming: this.handleIsdnIncoming };
    const bodyRequest = { action: 'updateHandleIsdnIncoming', data: data };
    this.http.put(`appsip/accounts/${sipUserName}`, bodyRequest).subscribe(
      resp => {
        X.showSuccess('Your setting has been updated successfully.');
      },
      error => {
        X.showWarn(error.message);
        this.handleIsdnIncoming = this.currentAccount.account['handleIsdnIncoming'];
      }
    );
  }

  onCopyPassword() {
    const sipUserName = this.currentAccount.account.username;
    const bodyRequest = { password: this.currentAccount.account.password };
    this.http.post(`appsip/accounts/${sipUserName}/copyPassword`, bodyRequest).subscribe(
      resp => {
        X.showSuccess('Your copy successfully.');
      },
      error => {
        X.showWarn(error.message);
      }
    );
  }

  onCloseModalAccountAdvance(event) {
    this.isShowAdvanceModal = false;
    this.cdr.detectChanges();

    if (event.isUpdate) {
      this.isShopModalConfirmUpdate = true;
      this.cdr.detectChanges();
      this.eventStreamService.trigger('confirm-update-advanced-configuration', {});
      this.accountAdvance = event;
    }
  }

  onCloseModalConfirmUpdate(event) {
    this.isShopModalConfirmUpdate = false;
    if (event.isUpdate) {
      this.selectedCapacity = this.accountAdvance.selectedCapacity;
      this.selectedSipGateWay = this.accountAdvance.selectedSipGateWay;
      this.handleIsdnIncoming = this.accountAdvance.handleIsdnIncoming;
      this.updateCapacity();
      this.updateSipType();
      this.updateISDN();
      return;
    }
  }
}
