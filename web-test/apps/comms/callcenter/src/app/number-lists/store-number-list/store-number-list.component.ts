import { Component, Inject, OnInit } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  CallerIdMode,
  CampaignInfo,
  CampaignService,
  Mode,
  QueueInfo,
  QueueService,
  RingOption
} from '@b3networks/api/callcenter';
import { CallerIdService } from '@b3networks/api/callerid-verification';
import { Subscription } from '@b3networks/api/subscription';
import { OrderBy, SortUtils } from '@b3networks/comms/callcenter/shared';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format } from 'date-fns';
import { of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { ConcurrentCallComponent } from '../../queue/concurrent-call/concurrent-call.component';

export interface StoreNumberListData {
  globalDncSubs: Subscription[];
  numberListData: CampaignInfo;
}

@Component({
  selector: 'b3n-store-number-list',
  templateUrl: './store-number-list.component.html',
  styleUrls: ['./store-number-list.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class StoreNumberListComponent implements OnInit {
  readonly Mode = Mode;

  requestData: CampaignInfo = new CampaignInfo();
  callerIds: string[] = [];
  isProcessing: boolean;
  queues: QueueInfo[];
  queueSelected: QueueInfo;
  isCreate: boolean;

  constructor(
    private callerIdService: CallerIdService,
    private queueService: QueueService,
    private campaignService: CampaignService,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<StoreNumberListComponent>,
    @Inject(MAT_DIALOG_DATA)
    public storeNumberListData: StoreNumberListData,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.getRequestData();
    this.getQueueList();
    this.callerIdService.findCallerIds(X.orgUuid).subscribe(data => {
      this.callerIds = data.data;
    });
  }

  getRequestData() {
    if (this.storeNumberListData.numberListData) {
      this.requestData = this.storeNumberListData.numberListData;
      this.requestData.callerId =
        this.storeNumberListData.numberListData.callerId === 'p'
          ? ''
          : this.storeNumberListData.numberListData.callerId;

      this.isCreate = false;
    } else {
      this.isCreate = true;
      this.requestData = new CampaignInfo({
        name: '',
        queueUuid: '',
        createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx"),
        callerId: '',
        callerIdMode: CallerIdMode.fixed,
        previewTime: 60,
        ringTime: 15,
        mode: Mode.progressive,
        ringOption: RingOption.agent,
        checkDnc: this.storeNumberListData.globalDncSubs && this.storeNumberListData.globalDncSubs.length > 0,

        clonedFromCampaignUuid: null,
        includeCampaignNumbers: false
      });
    }
  }

  getQueueList() {
    this.queueService
      .loadQueueList()
      .pipe(
        finalize(() => {
          this.isProcessing = false;
        })
      )
      .subscribe(data => {
        data = data.map(queue => {
          if (this.requestData.uuid) {
            if (queue.uuid === this.requestData.queueUuid) {
              this.queueSelected = queue;
            }
          }
          queue.numberOfAssignedAgents = queue.assignedAgents.length;
          return queue;
        });
        this.queues = SortUtils.sortBy(data, 'numberOfAssignedAgents', OrderBy.DESC);
      });
  }

  onSave() {
    this.isProcessing = true;
    this.requestData.queueUuid = this.queueSelected.uuid;
    of('')
      .pipe(
        switchMap(() => {
          if (this.isCreate) {
            return this.campaignService.createCampaign(this.requestData);
          } else {
            return this.campaignService.updateCampaign(this.requestData.uuid, this.requestData);
          }
        }),
        finalize(() => {
          this.isProcessing = false;
        })
      )
      .subscribe(
        result => {
          const msg = this.isCreate ? 'Created successfully' : 'Edited successfully!';
          this.toastService.success(msg);
          this.dialogRef.close(result);
        },
        err => {
          this.toastService.error(err.message);
          this.dialogRef.close(false);
        }
      );
  }
  showConcurrentCall(queue: QueueInfo) {
    this.dialog
      .open(ConcurrentCallComponent, {
        data: queue
      })
      .afterClosed()
      .subscribe(result => {
        if (
          (result && result.outboundConcurrentCallLimit == 0) ||
          (!result && queue.outboundConcurrentCallLimit == 0)
        ) {
          this.queueSelected = null;
          this.toastService.error('Can not select queue with outbound concurrent call is 0 ');
        }
      });
  }
}
