import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {
  CampaignInfo,
  OrgConfig,
  OrgConfigQuery,
  OrgConfigService,
  QueueConfig,
  QueueInfo,
  QueueService,
  Status
} from '@b3networks/api/callcenter';
import {DestroySubscriberComponent} from '@b3networks/shared/common';
import {ToastService} from '@b3networks/shared/ui/toast';
import {combineLatest} from 'rxjs';
import {delay, finalize, take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'b3n-concurrent-call',
  templateUrl: './concurrent-call.component.html',
  styleUrls: ['./concurrent-call.component.scss']
})
export class ConcurrentCallComponent extends DestroySubscriberComponent implements OnInit {
  loading: boolean;
  queue = new QueueConfig();
  config = new OrgConfig();
  saving = false;
  isQueueAssigned: CampaignInfo;
  availableConcurrentCall: number;
  outboundConcurrentCallUsageOfQueueOrther: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QueueInfo,
    private queueService: QueueService,
    private toastService: ToastService,
    private orgConfigQuery: OrgConfigQuery,
    private orgConfigService: OrgConfigService,
    public dialogRef: MatDialogRef<ConcurrentCallComponent>
  ) {
    super();
  }

  ngOnInit() {
    this.loading = true;
    if (this.data.relatedCampaigns?.length > 0) {
      this.isQueueAssigned = this.data.relatedCampaigns.find(c => c.status !== Status.finished);
    }
    combineLatest([this.queueService.getQueueConfig(this.data.uuid), this.orgConfigQuery.orgConfig$])
      .pipe(
        delay(400),
        take(1),
        finalize(() => (this.loading = false)),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(([queue, config]) => {
        this.queue = queue;
        this.config = config;

        this.outboundConcurrentCallUsageOfQueueOrther =
          config.outboundConcurrentCallUsage - queue.outboundConcurrentCallLimit;
        this.availableConcurrentCall =
          config.outboundConcurrentCallLimit - this.outboundConcurrentCallUsageOfQueueOrther;
      }),
      error => {
        this.toastService.error(error.message);
      };
    this.orgConfigService.getConfig().subscribe();
  }

  save() {
    this.saving = true;
    const config = {
      outboundConcurrentCallLimit: this.queue.outboundConcurrentCallLimit
    } as QueueConfig;

    this.queueService
      .updateQueueConfig(this.data.uuid, config)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        updatedQueue => {
          this.dialogRef.close(updatedQueue);
          this.toastService.success(
            'Outbound concurrent call has been updated. This update will take effect after 5 minutes.'
          );
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
