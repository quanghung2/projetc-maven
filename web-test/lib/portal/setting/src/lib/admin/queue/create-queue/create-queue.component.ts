import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CreateRequest, QueueConfig, QueueService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent, MyErrorStateMatcher } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface DialogCreateQueue {
  isDuplicate: boolean;
  data: CreateRequest;
  listFlow: { code: string; name: string }[];
  isCreate: boolean;
}

export const SLA_THRESHOLDS: KeyValue<number, string>[] = [
  { key: 10, value: '10' },
  { key: 15, value: '15' },
  { key: 20, value: '20' },
  { key: 30, value: '30' },
  { key: 45, value: '45' },
  { key: 60, value: '60' },
  { key: 90, value: '90' }
];

@Component({
  selector: 'b3n-create-queue',
  templateUrl: './create-queue.component.html',
  styleUrls: ['./create-queue.component.scss']
})
export class CreateQueueComponent extends DestroySubscriberComponent implements OnInit {
  readonly slaThresholds: KeyValue<number, string>[] = SLA_THRESHOLDS;
  creating: boolean;
  matcher = new MyErrorStateMatcher();
  createQueueForm: UntypedFormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public queue: DialogCreateQueue,
    private queueService: QueueService,
    private spinnerService: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<CreateQueueComponent>,
    private toastService: ToastService,
    private fb: UntypedFormBuilder
  ) {
    super();
  }

  get label() {
    return this.createQueueForm.get('label');
  }

  get priority() {
    return this.createQueueForm.get('priority');
  }

  get extension() {
    return this.createQueueForm.get('extension');
  }

  get wrapupTime() {
    return this.createQueueForm.get('wrapupTime');
  }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.createQueueForm = this.fb.group({
      label: ['', [Validators.required, Validators.maxLength(100)]],
      priority: [1, [Validators.min(1), Validators.max(100)]],
      extension: [null, [Validators.minLength(3), Validators.maxLength(5)]],
      wrapupTime: [30, [Validators.min(0), Validators.max(900)]],
      slaThreshold: [20]
    });
    if (this.queue.isDuplicate) {
      this.getQueueConfig();
    }
  }

  getQueueConfig() {
    this.queueService.getQueueConfig(this.queue.data.clonedQueue.uuid).subscribe(
      queue => {
        this.createQueueForm.patchValue({
          priority: queue.priority || 0,
          wrapupTime: queue.agentWorkflowConfig.wrapUpTimeInSeconds || 30,
          slaThreshold: queue.slaThreshold || 20
        });
      },
      err => {}
    );
  }

  create() {
    if (!this.queue.isCreate) {
      this.toastService.error('Exceeded the maximum number of Queues that can be created (100)');
      this.dialogRef.close();
      return;
    }
    if (this.createQueueForm.invalid) return;
    this.creating = true;
    const value = this.createQueueForm.value;
    const req = {
      label: value.label,
      code: value.extension,
      priority: value.priority,
      slaThreshold: value.slaThreshold,
      agentWorkflowConfig: {
        wrapUpTimeInSeconds: value.wrapupTime
      }
    } as QueueConfig;

    this.queueService
      .createQueueV2(req)
      .pipe(finalize(() => (this.creating = false)))
      .subscribe(
        res => {
          this.dialogRef.close(Object.assign(new QueueConfig(), res));
          this.toastService.success('Created successfully');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
