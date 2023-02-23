import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WebrtcService } from '@b3networks/api/call';
import { MeQuery } from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'csh-keypad',
  templateUrl: './keypad.component.html',
  styleUrls: ['./keypad.component.scss']
})
export class KeypadComponent extends DestroySubscriberComponent implements OnInit {
  phoneNumber: string;
  identityUuid: string;
  calling: boolean;

  @ViewChild('inputPhone') inputPhone: ElementRef;

  constructor(
    private meQuery: MeQuery,
    private dialogRef: MatDialogRef<KeypadComponent>,
    private webrtcService: WebrtcService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    super();
  }

  ngOnInit() {
    this.phoneNumber = '';
    this.initData();
  }

  inputNumber(i: string | number) {
    this.phoneNumber += i;
    if (this.data?.isDTMF) {
      this.webrtcService.doDTMF(i);
    }
    // var au = document.getElementById('keyAudio') as HTMLVideoElement;

    // switch (i) {
    //   case '*':
    //     au.src = 'audio/s.wav';
    //     au.play();
    //     break;
    //   case '#':
    //     au.src = 'audio/p.wav';
    //     au.play();
    //     break;
    //   default:
    //     au.src = 'audio/' + i + '.wav';
    //     au.play();
    //     break;
    // }
  }

  btnDelete() {
    this.phoneNumber = this.phoneNumber.slice(0, this.phoneNumber.length - 1);
  }

  doTransfer() {
    this.webrtcService.doDTMF('#');
    this.webrtcService.doDTMF('#');
    this.webrtcService.doDTMF('2');
    this.phoneNumber += '#';
    this.phoneNumber += '#';
    this.phoneNumber += '2';
    this.inputPhone?.nativeElement?.focus();
  }

  // btnCall() {
  //   const extension = this.staffExtensionQuery.getByIdentity(this.identityUuid);
  //   if (!extension || !extension.extKey) {
  //     this.toastService.warning('The extension is loading. Please wait for a few moments and try again.');
  //     return;
  //   }

  //   this.calling = true;
  //   let req = new MakeCallReq({
  //     customers: [{ phone: this.phoneNumber }],
  //     callflow: new CallFlow({
  //       steps: [CallFlowStep.dial2Extension(extension.extKey), CallFlowStep.connect2Customer(extension.extKey)]
  //     })
  //   });

  //   this.voiceService
  //     .makeCall(req)
  //     .pipe(finalize(() => (this.calling = false)))
  //     .subscribe(
  //       _ => {
  //         this.toastService.success('Your call already triggered. Please wait for a few seconds.');
  //       },
  //       err => {
  //         // retry
  //         this.toastService.error(err.message);
  //       }
  //     );
  // }

  doPress($event) {
    if (this.data?.isDTMF) {
      this.webrtcService.doDTMF($event.key);
    }
  }

  btnCall() {
    if (this.data?.isDTMF) {
      return;
    }
    this.dialogRef.close(this.phoneNumber);
  }

  private initData() {
    this.meQuery.me$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(me => me != null && !!me.identityUuid)
      )
      .subscribe(me => {
        this.identityUuid = me.identityUuid;
      });
  }
}
