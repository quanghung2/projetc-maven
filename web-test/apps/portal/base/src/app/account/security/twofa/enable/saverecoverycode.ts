import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TfaInfo } from '@b3networks/api/auth';
import { downloadData } from '@b3networks/shared/common';

@Component({
  selector: 'b3n-twofa-saveRecoveryCode',
  templateUrl: './saverecoverycode.html',
  styleUrls: ['../twofa.scss']
})
export class TwofaSaveRecoveryCodeSettingsComponent {
  @Input() tfaInfo: TfaInfo;
  @Input() mobileNumber: string;
  @Output() actionEvent = new EventEmitter();

  downloaded = false;
  showWarning = false;
  btnContinuteText = '';

  constructor() {}

  initData() {
    this.downloaded = false;
    this.showWarning = false;
    this.btnContinuteText = 'Download';
  }

  download() {
    if (this.downloaded) {
      this.finish();
    } else {
      this.downloaded = true;
      const file = new Blob([`RECOVERY KEY:\n\n${this.tfaInfo.recoveryKey}`], { type: 'text/plain;charset=utf-8' });
      const tempMobile = this.mobileNumber.replace('+', '');
      const downloadName = `${tempMobile}-recovery-key.txt`;
      downloadData(file, downloadName);
      this.btnContinuteText = 'Finish';
    }
  }

  cancel() {
    if (this.downloaded) {
      this.finish();
    } else {
      this.showWarning = true;
      this.downloaded = true;
    }
  }

  back() {
    this.showWarning = false;
    this.downloaded = false;
  }

  finish() {
    this.actionEvent.emit('cancel');
  }
}
