import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Me, SystemStatusCode, TxnType } from '@b3networks/api/callcenter';

interface Data {
  me: Me;
  defaultWrapUpTime: number;
}

@Component({
  selector: 'b3n-manual-outgoing-txn',
  templateUrl: './manual-outgoing-txn.component.html',
  styleUrls: ['./manual-outgoing-txn.component.scss']
})
export class ManualOutgoingTxnComponent implements OnInit {
  readonly ObjectKeys = Object.keys;
  readonly TxnType = TxnType;

  _me: Me;
  endedStatuses = ['agentMarkCallDone', 'hangupBySupervisor', 'ended', 'callback', 'voicemail'];

  @Input()
  set me(me: Me) {
    this._me = me;
    if (this.endedStatuses.includes(this._me.assignedTxn.status) || this._me.systemStatus === SystemStatusCode.acw) {
      this.closePopup();
    }
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Data,
    public dialogRef: MatDialogRef<ManualOutgoingTxnComponent>,
    private dialog: MatDialog
  ) {
    this._me = data.me;
  }

  ngOnInit() {}

  closePopup() {
    this.dialog.closeAll();
  }
}
