import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AuthenticationMode,
  CallerIdOptionMode,
  InboundRule,
  InboundRuleService,
  OutboundRule,
  OutboundRuleService,
  ReqUpdateIpPeer,
  SipAccount,
  SipTrunkQuery,
  SipTrunkService
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { of } from 'rxjs';
import { filter, finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ResetPasswordComponent, ResetPasswordInput } from './reset-password/reset-password.component';

@Component({
  selector: 'b3n-config-detail',
  templateUrl: './config-detail.component.html',
  styleUrls: ['./config-detail.component.scss']
})
export class ConfigDetailComponent extends DestroySubscriberComponent implements OnInit {
  isLoading: boolean;
  processing: boolean;
  authenticationMode: AuthenticationMode;
  sip: SipAccount;
  selectMode: CallerIdOptionMode;
  selectCallerIdByMode: string;
  availableCallerIds: string[];

  updateIpPeerReq: ReqUpdateIpPeer = {
    ip: null,
    protocol: null,
    port: null
  };

  outboundRules: OutboundRule[] = [];
  inboundRules: InboundRule[] = [];

  readonly CallerIdOptionMode = CallerIdOptionMode;
  readonly AuthenticationMode = AuthenticationMode;

  constructor(
    private sipTrunkQuery: SipTrunkQuery,
    private sipTrunkService: SipTrunkService,
    private toastService: ToastService,
    private outboundRuleService: OutboundRuleService,
    private inboundRuleService: InboundRuleService,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.sipTrunkQuery
      .selectActive()
      .pipe(
        filter(x => x != null),
        takeUntil(this.destroySubscriber$),
        tap(() => (this.isLoading = false))
      )
      .subscribe(sip => {
        this.sip = cloneDeep(sip);

        this.loadLabel(sip);

        if (sip.callerIdConfig?.mode !== CallerIdOptionMode.SIP_NUMBER || !sip.callerIdConfig.defaultCallerId) {
          const req = <SipAccount>{
            callerIdConfig: {
              mode: CallerIdOptionMode.SIP_NUMBER,
              defaultCallerId: 'private'
            }
          };
          this.sipTrunkService.updateAccountSipTrunk(sip.sipUsername, req).subscribe();
        }

        this.outboundRuleService.getOutboundRules().subscribe(list => (this.outboundRules = [...list]));
        this.inboundRuleService.getInboundRules().subscribe(list => (this.inboundRules = [...list]));
      });

    this.sipTrunkQuery.availableCallerIds$
      .pipe(
        takeUntil(this.destroySubscriber$),
        map(availableCallerIds => availableCallerIds.filter(c => c.match(/^\+?\d+$/g)))
      )
      .subscribe(availableCallerIds => (this.availableCallerIds = availableCallerIds));
  }

  update() {
    this.editIp();
    this.updateCallRule();
  }

  private loadLabel(sip: SipAccount) {
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

    this.authenticationMode = this.sip.detail?.config?.authenticationMode;
    if (!sip.isIP) {
      this.authenticationMode = AuthenticationMode.ACCOUNT;
    }
  }

  private updateCallRule() {
    const clone = <SipAccount>{
      incomingCallRule: this.sip.incomingCallRule,
      outgoingCallRule: this.sip.outgoingCallRule,
      callerIdConfig: {
        mode: CallerIdOptionMode.SIP_NUMBER,
        defaultCallerId: this.selectCallerIdByMode
      }
    };
    this.sipTrunkService
      .updateAccountSipTrunk(this.sip.sipUsername, clone)
      .pipe(finalize(() => (this.processing = false)))
      .subscribe(
        _ => {
          this.toastService.success('Updated successfully.');
        },
        err => this.toastService.error(err?.message)
      );
  }

  private editIp() {
    const changed = this.sip.detail?.config?.authenticationMode !== this.authenticationMode;
    if (changed) {
      this.processing = true;
      this.sipTrunkService
        .updateAuthenticationMode(this.sip.sipUsername, this.authenticationMode)
        .pipe(
          switchMap(_ =>
            this.authenticationMode === AuthenticationMode.IP
              ? this.sipTrunkService.updateIpPeer(this.sip.sipUsername, this.updateIpPeerReq)
              : of(null)
          ),
          finalize(() => (this.processing = false))
        )
        .subscribe(
          _ => {},
          err => this.toastService.error(err.message)
        );
    } else {
      if (this.authenticationMode === AuthenticationMode.IP) {
        this.processing = true;

        this.sipTrunkService
          .updateIpPeer(this.sip.sipUsername, this.updateIpPeerReq)
          .pipe(finalize(() => (this.processing = false)))
          .subscribe(
            _ => {},
            err => this.toastService.error(err.message)
          );
      }
    }
  }

  resetPassword() {
    this.dialog.open(ResetPasswordComponent, {
      data: <ResetPasswordInput>{
        sip: this.sip
      },
      disableClose: true,
      width: '400px'
    });
  }
}
