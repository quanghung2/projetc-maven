import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  AssignedTxn,
  CampaignInfo,
  CampaignService,
  CampaignTxnService,
  DetailCustomField,
  Me
} from '@b3networks/api/callcenter';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

class ActionRequest {
  note: string;
  code: string;
  action: string;
  txnUuid: string;
  tag: { [key: string]: string | string[] };

  successMsg(txn: AssignedTxn): string {
    if (this.action === 'skip') {
      return `You have just skipped customer who has number ${txn.customerNumber}`;
    } else if (this.action === 'dial') {
      return `Submited request to dial number ${txn.customerNumber}`;
    } else if (this.action === 'done') {
      return `Submited your note to server`;
    }

    return `${this.action.toUpperCase()} successfully`;
  }
}

@Component({
  selector: 'b3n-outbound-txn',
  templateUrl: './outbound-txn.component.html',
  styleUrls: ['./outbound-txn.component.scss']
})
export class OutboundTxnComponent implements OnInit {
  _me: Me;
  campaign: CampaignInfo;
  request: ActionRequest = new ActionRequest();
  inAcwMode = false;
  callEndedStatuses = [
    'answered',
    'agentUnanswered',
    'agentTransferFailed',
    'agentBusy',
    'talking',
    'customerBusy',
    'customerTransferFailed',
    'customerUnanswered'
  ];
  customFields: DetailCustomField[] = [];

  get hasCustomField() {
    return this._me?.assignedTxn?.queue?.customFields?.length > 0;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) data: Me,
    private campaignSevice: CampaignService,
    private campaignTxnService: CampaignTxnService,
    private toastService: ToastService,
    private spinnerService: LoadingSpinnerSerivce
  ) {
    this.me = data;
  }

  ngOnInit() {
    this.fetchCampaignDetails();
  }

  @Input()
  set me(me: Me) {
    this.showNotificationIfNeeded(me);
    this.inAcwMode = me.inAcwMode;
    this._me = me;
  }

  showNotificationIfNeeded(me: Me) {
    if (!this._me || !this._me.assignedTxn || !me.assignedTxn) {
      return;
    }

    if (this._me.assignedTxn.txnUuid === me.assignedTxn.txnUuid) {
      return;
    }

    this.request.code = '';
    this.request.note = '';
    this.request.tag = {};
    this.toastService.success(`You have been assigned to new auto dialer call to ${me.assignedTxn.customerNumber}`);
  }

  fetchCampaignDetails() {
    this.spinnerService.showSpinner();
    this.campaignSevice
      .getCampaign(this._me.assignedTxn.campaignUuid)
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        res => {
          this.campaign = res;
          this.customFields = this._me?.assignedTxn?.queue?.customFields || [];
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  takeAction(action: string) {
    this.request.action = action;
    this.request.txnUuid = this._me.assignedTxn.txnUuid;
    const tag = {};
    this.customFields.forEach(field => {
      const prop = field.key;
      tag[prop] = field.value;
    });
    this.request.tag = tag;

    this.spinnerService.showSpinner();
    this.campaignTxnService
      .updateCampaign(this._me.assignedTxn.campaignUuid, this.request)
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        _ => {
          this.toastService.success(this.request.successMsg(this._me.assignedTxn));
        },
        err => {
          this.toastService.error(err.message.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
        }
      );
  }

  copy() {
    this.toastService.success('Copied to clipboard');
  }
}
