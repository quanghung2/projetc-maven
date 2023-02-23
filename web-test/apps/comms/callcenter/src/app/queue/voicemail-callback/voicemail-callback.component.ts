import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import {
  CallbackConfig,
  CallflowConfig,
  QueueConfig,
  QueueInfo,
  QueueService,
  TtsConfig
} from '@b3networks/api/callcenter';
import { CallerIdService } from '@b3networks/api/callerid-verification';
import { X } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin, of } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { VoicemailDetailComponent } from './voicemail-detail/voicemail-detail.component';

@Component({
  selector: 'b3n-voicemail-callback',
  templateUrl: './voicemail-callback.component.html',
  styleUrls: ['./voicemail-callback.component.scss']
})
export class VoicemailCallbackComponent implements OnInit {
  @ViewChild(VoicemailDetailComponent) voicemailComp: VoicemailDetailComponent;
  queue: QueueConfig;
  announcementMessage2agent: TtsConfig;
  askCallerContactMessage: TtsConfig;
  confirmCallerContactMessage: TtsConfig;
  byeMessage: TtsConfig;
  reachLimitRetryInputContactMessage: TtsConfig;
  invalidContactMessage: TtsConfig;
  voiceMailMessage: TtsConfig;
  callerIds = [];
  isInvalidVoiceMail;
  errorMessage: string;

  progressing: boolean;
  loading: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QueueInfo,
    private queueService: QueueService,
    private callerIdService: CallerIdService,
    private toastService: ToastService,
    private spinnerService: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<VoicemailCallbackComponent>
  ) {
    this.reload();
  }

  onInvaildForm($event) {
    this.isInvalidVoiceMail = $event;
  }

  reload() {
    this.loading = true;
    const queueStream = this.queueService.getQueueConfig(this.data.uuid).pipe(
      map(res => {
        const obj = Object.assign(new QueueConfig(), res);
        obj.callflowConfig = Object.assign(new CallflowConfig(), res.callflowConfig);
        obj.callflowConfig.callbackConfig = Object.assign(new CallbackConfig(), res.callflowConfig.callbackConfig);
        return obj;
      })
    );

    const callerIdStream = this.callerIdService.findCallerIds(X.orgUuid);

    forkJoin([queueStream, callerIdStream])
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        res => {
          this.queue = res[0];
          this.callerIds = res[1]['data'];
          this.announcementMessage2agent = this.queue.callflowConfig.callbackConfig.announcementMessage2agentConfig;
          this.askCallerContactMessage = this.queue.callflowConfig.callbackConfig.askCallerContactMessageConfig;
          this.confirmCallerContactMessage = this.queue.callflowConfig.callbackConfig.confirmCallerContactMessageConfig;
          this.byeMessage = this.queue.callflowConfig.callbackConfig.byeMessageConfig;
          this.reachLimitRetryInputContactMessage = this.queue.callflowConfig.callbackConfig.reachLimitRetryInputContactMessageConfig;
          this.invalidContactMessage = this.queue.callflowConfig.callbackConfig.invalidContactMessageConfig;
          this.voiceMailMessage = this.queue.callflowConfig.voicemailConfig.voiceMailMessageConfig;
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  ngOnInit() {}

  enabledVoicemailChanged(evt: MatSlideToggleChange) {
    this.queue.callflowConfig.enabledVoicemail = evt.checked;
  }

  enabledCallbackChanged(evt: MatSlideToggleChange) {
    this.queue.callflowConfig.enabledCallback = evt.checked;
  }

  enabledAgentChanged(evt: MatSlideToggleChange) {
    this.queue.callflowConfig.enableAgentRoute = evt.checked;
  }

  callbackFlowChanged(evt: MatSelectChange) {
    if (evt.value === 'create') {
      this.doCreate().subscribe(c => {
        this.queue.callflowConfig.callbackFlowId = c.uuid;
      });

      return;
    }
  }

  doCreate() {
    return of({
      uuid: 'XYZ',
      label: 'New call flow'
    });
  }

  voicemailFlowChanged(evt: MatSelectChange) {
    if (evt.value === 'create') {
      this.doCreate().subscribe(c => {
        this.queue.callflowConfig.voicemailFlowId = c.uuid;
      });

      return;
    }
  }

  save() {
    if (
      this.queue.callflowConfig.enabledVoicemail &&
      this.queue.callflowConfig.enabledCallback &&
      +this.queue.callflowConfig.digitsTriggerVoiceMail === +this.queue.callflowConfig.digitsTriggerCallback
    ) {
      this.errorMessage = 'Digit to trigger Voicemail must be different from Digit to trigger Callback';
      return;
    }

    if (
      this.queue.callflowConfig.enabledVoicemail &&
      this.queue.callflowConfig.enableAgentRoute &&
      +this.queue.callflowConfig.digitsTriggerVoiceMail === +this.queue.callflowConfig.digitsTriggerDetermineNextAgent
    ) {
      this.errorMessage = 'Digit to trigger Voicemail must be different from Digit to trigger Agents';
      return;
    }

    if (
      this.queue.callflowConfig.enabledCallback &&
      this.queue.callflowConfig.enableAgentRoute &&
      +this.queue.callflowConfig.digitsTriggerCallback === +this.queue.callflowConfig.digitsTriggerDetermineNextAgent
    ) {
      this.errorMessage = 'Digit to trigger Callback must be different from Digit to trigger Agents';
      return;
    }

    this.errorMessage = '';
    this.queue.callflowConfig.callbackConfig.announcementMessage2agent = this.announcementMessage2agent.xml();
    this.queue.callflowConfig.callbackConfig.askCallerContactMessage = this.askCallerContactMessage.xml();
    this.queue.callflowConfig.callbackConfig.confirmCallerContactMessage = this.confirmCallerContactMessage.xml();
    this.queue.callflowConfig.callbackConfig.byeMessage = this.byeMessage.xml();
    this.queue.callflowConfig.callbackConfig.reachLimitRetryInputContactMessage = this.reachLimitRetryInputContactMessage.xml();
    this.queue.callflowConfig.callbackConfig.invalidContactMessage = this.invalidContactMessage.xml();
    this.queue.callflowConfig.voicemailConfig.message = this.voiceMailMessage.xml();

    this.setValueVoicemail();

    this.progressing = true;
    const { dialPlanList, ...callbackConfig } = this.queue.callflowConfig.callbackConfig;
    const config = {
      callflowConfig: {
        digitsTriggerVoiceMail: this.queue.callflowConfig.digitsTriggerVoiceMail,
        digitsTriggerCallback: this.queue.callflowConfig.digitsTriggerCallback,
        digitsTriggerDetermineNextAgent: this.queue.callflowConfig.digitsTriggerDetermineNextAgent,
        callbackConfig: callbackConfig,
        voicemailConfig: this.queue.callflowConfig.voicemailConfig
      } as CallflowConfig
    } as QueueConfig;

    this.queueService
      .updateQueueConfig(this.data.uuid, config)
      .pipe(
        map(res => {
          const obj = Object.assign(new QueueConfig(), res);
          obj.callflowConfig = Object.assign(new CallflowConfig(), res.callflowConfig);
          obj.callflowConfig.callbackConfig = Object.assign(new CallbackConfig(), res.callflowConfig.callbackConfig);
          return obj;
        }),
        finalize(() => (this.progressing = false))
      )
      .subscribe(
        queue => {
          this.queue = queue;
          this.dialogRef.close('saved');
          this.toastService.success('Update successfully. This update will take effect after 5 minutes.');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  setValueVoicemail() {
    if (this.voicemailComp) {
      const valueForm = this.voicemailComp._form.value;
      this.queue.callflowConfig.voicemailConfig.emails = valueForm.emails.map(x => x.name);
      this.queue.callflowConfig.voicemailConfig.isEnabledSendToEmail = valueForm.isEnabledSendToEmail;
    }
  }

  autoRecoveryCallbackChanged(event: MatSlideToggleChange) {
    this.queue.callflowConfig.callbackConfig.autoRecoveryCallback = event.checked;
  }
}
