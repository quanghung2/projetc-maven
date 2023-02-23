import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AuthenticationMode,
  CallerIdOptionMode,
  InboundRule,
  OutboundRule,
  ReqUpdateIpPeer,
  SipAccount,
  SipTrunkQuery,
  SipTrunkService
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent, donwloadFromUrl } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { filter, map, takeUntil } from 'rxjs/operators';
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
} from '../shared';
import { DetailAccountComponent, DetailAccountInput } from './detail-account/detail-account.component';
import { EditIpSipComponent, EditIpSipInput } from './edit-ip-sip/edit-ip-sip.component';
import { ResetPasswordComponent, ResetPasswordInput } from './reset-password/reset-password.component';

@Component({
  selector: 'b3n-sip-account',
  templateUrl: './sip-account.component.html',
  styleUrls: ['./sip-account.component.scss']
})
export class SipAccountComponent extends DestroySubscriberComponent implements OnInit {
  isdnCallerIds: string[];
  ui = {
    subSipDomain: null,
    pbxConfig: <any>{}
  };

  updateIpPeerReq: ReqUpdateIpPeer = {
    ip: null,
    protocol: null,
    port: null
  };
  sip: SipAccount;
  selectMode: CallerIdOptionMode;
  selectCallerIdByMode: string;
  incomingCallRule: string;
  outboundRules: OutboundRule[] = [];
  inboundRules: InboundRule[] = [];

  readonly AuthenticationMode = AuthenticationMode;
  readonly CallerIdOptionMode = CallerIdOptionMode;

  constructor(
    private sipTrunkQuery: SipTrunkQuery,
    private sipTrunkService: SipTrunkService,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.sipTrunkQuery
      .selectActive()
      .pipe(
        filter(x => x != null),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(sip => {
        this.sip = cloneDeep(sip);
        this.loadLabelSipAccount(sip);

        if (sip.callerIdConfig?.mode !== CallerIdOptionMode.SIP_NUMBER || !sip.callerIdConfig.defaultCallerId) {
          const req = <SipAccount>{
            callerIdConfig: {
              mode: CallerIdOptionMode.SIP_NUMBER,
              defaultCallerId: 'private'
            }
          };
          this.sipTrunkService.updateAccountSipTrunk(sip.sipUsername, req).subscribe();
        }
      });

    this.sipTrunkQuery.isdnCallerIds$
      .pipe(
        takeUntil(this.destroySubscriber$),
        map(availableCallerIds => availableCallerIds.filter(c => c.match(/^\+?\d+$/g)))
      )
      .subscribe(isdnCallerIds => {
        this.isdnCallerIds = isdnCallerIds;
      });

    this.sipTrunkService.getCallerIdISDN().subscribe();
  }

  editIpSip() {
    this.dialog.open(EditIpSipComponent, {
      data: <EditIpSipInput>{
        sip: this.sip,
        updateIpPeerReq: Object.assign({}, this.updateIpPeerReq)
      },
      width: '500px',
      disableClose: true
    });
  }

  protocalChange($event) {
    this.sipTrunkService.updateIpPeer(this.sip.sipUsername, this.updateIpPeerReq).subscribe(_ => {});
  }

  detailAccount(sip: SipAccount) {
    this.dialog.open(DetailAccountComponent, {
      data: <DetailAccountInput>{
        sip: sip,
        pbxConfig: this.ui.pbxConfig
      },
      disableClose: true
    });
  }

  selectCallerIdByModeChanged($event, sip: SipAccount) {
    const clone = <SipAccount>{
      callerIdConfig: {
        mode: CallerIdOptionMode.SIP_NUMBER,
        defaultCallerId: this.selectCallerIdByMode
      }
    };
    this.updateSip(sip.sipUsername, clone);
  }

  changeAuthenticationMode(mode: AuthenticationMode, sip: SipAccount) {
    this.sipTrunkService.updateAuthenticationMode(sip.sipUsername, mode).subscribe(
      _ => {
        this.toastService.success('Your setting has been updated successfully.');
      },
      err => this.toastService.error(err?.message)
    );
  }

  getTLSKey(sip: SipAccount) {
    this.sipTrunkService.getTLSKeyAccount(sip.sipUsername).subscribe(
      res => {
        donwloadFromUrl(res['keyUrl'], 'Certificate');
      },
      err => this.toastService.error('Cannot get tls certificate.')
    );
  }

  resetPassword(sip: SipAccount) {
    this.dialog.open(ResetPasswordComponent, {
      data: <ResetPasswordInput>{
        sip: sip
      },
      disableClose: true,
      width: '400px'
    });
  }

  private loadLabelSipAccount(sip: SipAccount) {
    this.selectMode = sip.callerIdConfig?.mode || CallerIdOptionMode.SIP_NUMBER;
    if (this.selectMode === CallerIdOptionMode.SIP_NUMBER) {
      this.selectCallerIdByMode = sip.callerIdConfig.defaultCallerId;
    }

    sip.detail?.config?.ipPeers?.forEach(peer => {
      this.updateIpPeerReq = {
        ip: peer.ip,
        protocol: peer.protocol,
        port: peer.port
      };
    });

    if (sip.sipAccount.domain.indexOf('sip1') === 0) {
      if (sip.sipAccount.domain.indexOf('b3networks') !== -1) {
        this.ui.pbxConfig = sip1b3networks;
      } else {
        this.ui.pbxConfig = sip1;
      }
      this.ui.subSipDomain = 'sip1';
    } else if (sip.sipAccount.domain.indexOf('sip2') === 0) {
      if (sip.sipAccount.domain.indexOf('b3networks') !== -1) {
        this.ui.pbxConfig = sip2b3;
      } else {
        this.ui.pbxConfig = sip2;
      }
      this.ui.subSipDomain = 'sip2';
    } else if (sip.sipAccount.domain.indexOf('sip3') === 0) {
      if (sip.sipAccount.domain.indexOf('b3networks') !== -1) {
        this.ui.pbxConfig = sip3b3;
      } else {
        this.ui.pbxConfig = sip3;
      }
      this.ui.subSipDomain = 'sip3';
    } else if (sip.sipAccount.domain.indexOf('sip5') === 0) {
      if (sip.sipAccount.domain.indexOf('b3networks') !== -1) {
        this.ui.pbxConfig = sip5b3;
      }

      this.ui.subSipDomain = 'sip5';
    } else if (sip.sipAccount.domain.indexOf('sip6') === 0) {
      if (sip.sipAccount.domain.indexOf('b3networks') !== -1) {
        this.ui.pbxConfig = sip6b3;
      }
      this.ui.subSipDomain = 'sip6';
    } else if (sip.sipAccount.domain.indexOf('sip8') === 0) {
      if (sip.sipAccount.domain.indexOf('b3networks') !== -1) {
        this.ui.pbxConfig = sip8b3;
      }
      this.ui.subSipDomain = 'sip8';
    } else if (sip.sipAccount.domain.indexOf('siptest') === 0) {
      this.ui.pbxConfig = siptestb3;
      this.ui.subSipDomain = 'siptest';
    } else if (sip.sipAccount.domain.indexOf('sipbiz') === 0) {
      this.ui.pbxConfig = sipbiz;
      this.ui.subSipDomain = 'sipbiz';
    } else if (sip.sipAccount.domain.indexOf('sipmy') === 0) {
      this.ui.pbxConfig = sipmy;
      this.ui.subSipDomain = 'sipmy';
    } else if (sip.sipAccount.domain.indexOf('sipsg') === 0) {
      this.ui.pbxConfig = sipsg;
      this.ui.subSipDomain = 'sipsg';
    } else if (sip.sipAccount.domain.indexOf('siptls') === 0) {
      this.ui.pbxConfig = siptls;
      this.ui.subSipDomain = 'siptls';
    } else if (sip.sipAccount.domain.indexOf('siptrunk') === 0) {
      this.ui.pbxConfig = siptrunk;
      this.ui.subSipDomain = 'siptrunk';
    }
  }

  private updateSip(sipUsername: string, clone: Partial<SipAccount>) {
    this.sipTrunkService.updateAccountSipTrunk(sipUsername, clone).subscribe(
      _ => {
        this.toastService.success('Your setting has been updated successfully.');
      },
      err => this.toastService.error(err?.message)
    );
  }
}
