import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CallflowConfig, QueueConfig, QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { FlowService } from '@b3networks/api/flow';
import { DestroySubscriberComponent, MyErrorStateMatcher } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { delay, finalize } from 'rxjs/operators';
import { SLA_THRESHOLDS } from '../create-queue/create-queue.component';

export class EditQueueInput {
  queue: QueueInfo;
  listFlow: { code: string; name: string }[];
}

@Component({
  selector: 'b3n-edit-queue',
  templateUrl: './edit-queue.component.html',
  styleUrls: ['./edit-queue.component.scss']
})
export class EditQueueComponent extends DestroySubscriberComponent implements OnInit {
  queue = new QueueConfig();
  saving = false;
  loading: boolean;
  matcher = new MyErrorStateMatcher();
  queueForm: UntypedFormGroup;

  readonly slaThresholds: KeyValue<number, string>[] = SLA_THRESHOLDS;

  readonly abdThresholds: KeyValue<number, string>[] = [
    { key: 0, value: '0' },
    { key: 5, value: '5' },
    { key: 10, value: '10' }
  ];

  get label() {
    return this.queueForm.get('label');
  }

  get priority() {
    return this.queueForm.get('priority');
  }

  get extension() {
    return this.queueForm.get('extension');
  }

  get wrapupTime() {
    return this.queueForm.get('wrapupTime');
  }

  get slaThreshold() {
    return this.queueForm.get('slaThreshold');
  }

  get abandonedThreshold() {
    return this.queueForm.get('abandonedThreshold');
  }

  get genieCode() {
    return this.queueForm.get('genieCode');
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditQueueInput,
    private flowService: FlowService,
    private queueService: QueueService,
    private toastService: ToastService,
    private spinnerService: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<EditQueueComponent>,
    private fb: UntypedFormBuilder
  ) {
    super();
  }

  ngOnInit() {
    this.loading = true;
    this.queueService
      .getQueueConfig(this.data.queue.uuid)
      .pipe(
        delay(400),
        finalize(() => (this.loading = false))
      )
      .subscribe(
        queue => {
          this.queue = queue;
          if (!this.queue.agentWorkflowConfig.wrapUpTimeInSeconds) {
            this.queue.agentWorkflowConfig.wrapUpTimeInSeconds = 30; // default
          }
          if (!this.queue.slaThreshold) {
            this.queue.slaThreshold = 30; // default
          }
          this.initForm();
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  save() {
    if (this.queueForm.invalid) return;
    this.saving = true;
    this.queue.agentWorkflowConfig.wrapUpTimeInSeconds = this.wrapupTime.value;
    const config = {
      priority: this.priority.value,
      label: this.label.value,
      code: this.extension.value,
      agentWorkflowConfig: this.queue.agentWorkflowConfig,
      slaThreshold: this.slaThreshold.value,
      thresholdConfigs: { abandonedThreshold: this.abandonedThreshold.value }
    } as QueueConfig;
    if (this.queue.callflowConfig?.genieCode) {
      config.callflowConfig = {} as CallflowConfig;
      config.callflowConfig.genieCode = this.genieCode.value;
    }
    this.queueService
      .updateQueueConfig(this.data.queue.uuid, config)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        updatedQueue => {
          this.dialogRef.close(updatedQueue);
          this.toastService.success('Queue information has been updated.');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  private initForm() {
    this.queueForm = this.fb.group({
      label: [this.queue.label, [Validators.required, Validators.maxLength(100)]],
      priority: [this.queue.priority, [Validators.min(1), Validators.max(100)]],
      extension: [this.queue.code, [Validators.minLength(3), Validators.maxLength(5)]],
      wrapupTime: [this.queue.agentWorkflowConfig.wrapUpTimeInSeconds, [Validators.min(0), Validators.max(900)]],
      slaThreshold: [this.queue.slaThreshold],
      abandonedThreshold: [this.queue.thresholdConfigs.abandonedThreshold]
    });
    if (this.queue.callflowConfig?.genieCode) {
      this.queueForm.addControl('genieCode', this.fb.control(this.queue.callflowConfig.genieCode, Validators.required));
    }
  }
}
