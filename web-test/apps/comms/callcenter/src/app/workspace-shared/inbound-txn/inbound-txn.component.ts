import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AgentService, DetailCustomField, Me, SystemStatusCode } from '@b3networks/api/callcenter';
import {
  ActionContactModel,
  ActionDisplay,
  ActionError,
  ContactUser,
  EnumTypeActionContact,
  IntegrationModel,
  IntegrationService
} from '@b3networks/api/integration';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { of } from 'rxjs';
import { finalize, mergeMap } from 'rxjs/operators';

interface InboundPopupData {
  me: Me;
  defaultWrapUpTime: number;
}

@Component({
  selector: 'b3n-inbound-txn',
  templateUrl: './inbound-txn.component.html',
  styleUrls: ['./inbound-txn.component.scss']
})
export class InboundTxnComponent implements OnInit {
  readonly ObjectKeys = Object.keys;
  readonly SystemStatusCode = SystemStatusCode;

  private _me: Me;

  timer: any;
  defaultWrapUpTime: number;
  isIntegration: boolean;
  request = {
    code: '',
    note: '',
    tag: <{ [key: string]: string | string[] }>{},
    session: ''
  };
  endedStatuses = ['agentMarkCallDone', 'hangupBySupervisor', 'ended', 'callback', 'voicemail'];
  arrCRM: ActionContactModel[];
  enumTypeAction = EnumTypeActionContact;
  isLoading = false;
  isCRM = false;
  defaultWidth = 450;
  customFields: DetailCustomField[] = [];

  @Input()
  set me(me: Me) {
    this._me = me;

    this.showNotificationIfNeeded(me);
    console.log(this._me.assignedTxn);

    if (this.endedStatuses.includes(this._me.assignedTxn.status) || this._me.systemStatus === SystemStatusCode.acw) {
      this.closePopupAfter(this.defaultWrapUpTime);
    }
  }

  get me() {
    return this._me;
  }

  get hasCustomField() {
    return this.customFields?.length > 0;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: InboundPopupData,
    private agentService: AgentService,
    private toastService: ToastService,
    private spinnerService: LoadingSpinnerSerivce,
    private dialog: MatDialog,
    private integrationService: IntegrationService
  ) {}

  ngOnInit() {
    this._me = this.data.me;
    this.defaultWrapUpTime = this.data.defaultWrapUpTime;
    if (this._me.assignedTxn.customerNumber !== 'private') {
      this.checkCRMIntegration();
    }

    this.customFields = this._me?.assignedTxn?.queue?.customFields || [];
  }

  onLoadDisplayContact(contact: ActionDisplay) {
    this.arrCRM = [];
    const item = new ActionContactModel();
    item.action = contact;
    item.code = EnumTypeActionContact.Display;
    this.arrCRM.push(item);
  }

  checkCRMIntegration() {
    this.integrationService
      .getIntegrationStatus()
      .pipe(
        mergeMap((res: IntegrationModel) => {
          this.isIntegration = res.crmIntegrated;
          if (res.crmIntegrated) {
            this.isLoading = true;
            this.isCRM = true;
            const call = this._me.assignedTxn;
            return this.integrationService.fetchDataFromCRM(
              Object.assign(new ContactUser(), {
                callUuid: call.txnUuid,
                phoneNumber: call.customerNumber
              })
            );
          }
          return of();
        })
      )
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        (data: ActionContactModel[]) => {
          if (data) {
            if (data[0].code === EnumTypeActionContact.ErrorCreate) {
              this.toastService.error((<ActionError>data[0].action).data.errorMsg);
            } else {
              this.arrCRM = data;
            }
          }
        },
        err => {
          this.isCRM = false;
          this.toastService.error(err.message);
        }
      );
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
    this.toastService.success(`You have been assigned to new incoming call from ${me.assignedTxn.customerNumber}`);
  }

  update() {
    if (this.endedStatuses.includes(this._me.assignedTxn.status) || this._me.systemStatus === SystemStatusCode.acw) {
      this.closePopupAfter(this.defaultWrapUpTime);
    }
  }

  closePopupAfter(value: number) {
    clearTimeout(this.timer);
    this.timer = setTimeout(_ => {
      this.dialog.closeAll();
    }, value * 1000);
  }

  finishAcw() {
    this.request.session = this._me.assignedTxn.txnUuid;
    const tag = {};
    this.customFields.forEach(field => {
      const prop = field.key;
      tag[prop] = field.value;
    });
    this.request.tag = tag;

    this.spinnerService.showSpinner();
    this.agentService
      .finishInboundAcw(this.request)
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        res => {
          this.toastService.success('Call has been finished');
          this.dialog.closeAll();
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
