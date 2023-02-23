import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AgentService, Me, SystemStatusCode } from '@b3networks/api/callcenter';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-callback-txn',
  templateUrl: './callback-txn.component.html',
  styleUrls: ['./callback-txn.component.scss']
})
export class CallbackTxnComponent implements OnInit {
  readonly ObjectKeys = Object.keys;
  readonly SystemStatusCode = SystemStatusCode;
  _me: Me;

  request: any = {
    code: '',
    note: ''
  };
  endedStatuses = ['agentMarkCallDone', 'hangupBySupervisor', 'ended'];

  constructor(
    @Inject(MAT_DIALOG_DATA) data: Me,
    public toastService: ToastService,
    private agentService: AgentService,
    private spinnerService: LoadingSpinnerSerivce
  ) {
    this.me = data;
  }

  ngOnInit() {}

  @Input()
  set me(me: Me) {
    this.showNotificationIfNeeded(me);
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
    this.toastService.success(`You have been assigned to new incoming call from ${me.assignedTxn.customerNumber}`);
  }

  finishAcw() {
    this.request.session = this._me.assignedTxn.txnUuid;
    this.spinnerService.showSpinner();
    this.agentService
      .finishCallbackAcw(this.request)
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        res => {
          this.toastService.success('Call has been finished');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
