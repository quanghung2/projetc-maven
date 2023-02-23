import { DatePipe } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { ControlContainer, NgForm, NgModel } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  CallerIdMode,
  CampaignInfo,
  CampaignLicenseInfo,
  CampaignLicenseService,
  CampaignType,
  Mode,
  QueueInfo,
  QueueService,
  RingOption
} from '@b3networks/api/callcenter';
import { CallerIdService } from '@b3networks/api/callerid-verification';
import { Flow } from '@b3networks/api/flow';
import { Subscription } from '@b3networks/api/subscription';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format } from 'date-fns';
import { cloneDeep } from 'lodash';
import { of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

export interface StoreCampaignData {
  globalDncSubs: Subscription[];
  numberListData: CampaignLicenseInfo;
  hasSMSLicense: boolean;
  flowsSMS: Flow[];
  hasRobocall: boolean;
  flowsRobocall: Flow[];
  hasContactCenter: boolean;
}

@Component({
  selector: 'b3n-store-campaign',
  templateUrl: './store-campaign.component.html',
  styleUrls: ['./store-campaign.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class StoreCampaignComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('toRef') toRef: NgModel;

  requestData: CampaignLicenseInfo = new CampaignLicenseInfo();
  callerIds: string[] = [];
  isProcessing: boolean;
  flowSelected: Flow;
  flowSelectedSMS: Flow;
  isCreate: boolean;

  // outbound contact center
  queues: QueueInfo[] = [];
  queueSelected: string;
  mode: Mode = Mode.progressive;
  callerIdMode: CallerIdMode = CallerIdMode.fixed;
  callerId: string;
  runTimeFrom: string;
  runTimeTo: string;
  enableRunTime: boolean;
  runTimeValid: boolean;

  @ViewChild('inputSMS') inputSMS: ElementRef;

  readonly CampaignType = CampaignType;
  readonly Mode = Mode;
  readonly CallerIdMode = CallerIdMode;

  constructor(
    private callerIdService: CallerIdService,
    private campaignService: CampaignLicenseService,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<StoreCampaignComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: StoreCampaignData,
    public dialog: MatDialog,
    private queueService: QueueService,
    private datePipe: DatePipe
  ) {
    super();
  }

  ngOnInit() {
    this.callerIdService.findCallerIds(X.orgUuid).subscribe(callers => {
      this.callerIds = callers.data;
      this.getRequestData();
    });

    this.queueService.loadQueueList().subscribe(queues => {
      this.queues = queues;
    });
  }

  changeType($event: CampaignType) {
    this.requestData.callerId = null;
    if ($event === CampaignType.sms) {
      setTimeout(() => {
        this.inputSMS?.nativeElement.focus();
      }, 300);
    }
  }

  onSave() {
    this.isProcessing = true;
    const data = cloneDeep(this.requestData);

    if (data.type === CampaignType.sms) {
      if (!!this.flowSelectedSMS) {
        data.flowUuid = this.flowSelectedSMS.uuid;
        data.flowBaseSubscriptionUuid = this.flowSelectedSMS.subUuid;
      }
    } else if (data.type === CampaignType.voice) {
      if (!!this.flowSelected) {
        data.flowUuid = this.flowSelected.uuid;
        data.flowBaseSubscriptionUuid = this.flowSelected.subUuid;
      }
    } else {
      data.type = CampaignType.voice;
      data.queueUuid = this.queueSelected;
      data.mode = this.mode;
      data.callerIdMode = this.callerIdMode;

      if (this.callerIdMode === CallerIdMode.fixed) {
        data.callerId = this.callerId;
      }
    }

    if (this.enableRunTime) {
      const fromArr = new Date(this.runTimeFrom).toTimeString().split(' ')[0].split(':');
      const toArr = new Date(this.runTimeTo).toTimeString().split(' ')[0].split(':');

      fromArr.pop();
      toArr.pop();

      const from = fromArr.join(':');
      const to = toArr.join(':');

      data.runTime = {
        FRIDAY: [{ from, to }],
        MONDAY: [{ from, to }],
        SATURDAY: [{ from, to }],
        SUNDAY: [{ from, to }],
        THURSDAY: [{ from, to }],
        TUESDAY: [{ from, to }],
        WEDNESDAY: [{ from, to }]
      };
    } else {
      data.runTime = {
        FRIDAY: [],
        MONDAY: [],
        SATURDAY: [],
        SUNDAY: [],
        THURSDAY: [],
        TUESDAY: [],
        WEDNESDAY: []
      };
    }

    if (data.scheduledAt) {
      const time = this.datePipe.transform(data.scheduledAt, 'HH:mm');
      const date = this.datePipe.transform(data.scheduledAt, 'yyyy-MM-dd');
      data.scheduledAt = `${date} ${time}`;
    }

    of('')
      .pipe(
        switchMap(() => {
          if (this.isCreate) {
            return this.campaignService.createCampaignV2(data);
          } else {
            return this.campaignService.updateCampaignV2(data.uuid, data);
          }
        }),
        finalize(() => {
          this.isProcessing = false;
        })
      )
      .subscribe(
        (result: CampaignInfo) => {
          const msg = this.isCreate ? 'Created successfully!!' : 'Edited successfully!!';
          this.toastService.success(msg);
          this.dialogRef.close(result);
        },
        err => {
          this.toastService.error(err.message);
          this.dialogRef.close(false);
        }
      );
  }

  private getRequestData() {
    if (this.data.numberListData) {
      this.requestData = this.data.numberListData;
      this.requestData.callerId = this.data.numberListData.callerId === 'p' ? '' : this.data.numberListData.callerId;

      this.flowSelected = this.data.flowsRobocall.find(x => x.uuid === this.data.numberListData.flowUuid);
      this.flowSelectedSMS = this.data.flowsSMS.find(x => x.uuid === this.data.numberListData.flowUuid);

      this.isCreate = false;

      if (this.requestData.queueUuid) {
        this.requestData.type = CampaignType.outboundContactCenter;
        this.queueSelected = this.requestData.queueUuid;
        this.mode = this.requestData.mode;
        this.callerIdMode = this.requestData.callerIdMode;

        if (this.requestData.callerId) {
          this.callerId = this.requestData.callerId;
        }
      }

      this.enableRunTime = !!this.requestData.runTime.MONDAY?.length;

      if (this.enableRunTime) {
        const timeRange = this.requestData.runTime.MONDAY[0];

        const from = timeRange.from.split(':');
        const fromDate = new Date();
        fromDate.setHours(+from[0]);
        fromDate.setMinutes(+from[1]);
        this.runTimeFrom = fromDate.toISOString();

        const to = timeRange.to.split(':');
        const toDate = new Date();
        toDate.setHours(+to[0]);
        toDate.setMinutes(+to[1]);
        this.runTimeTo = toDate.toISOString();
      }
    } else {
      this.isCreate = true;
      this.requestData = new CampaignLicenseInfo({
        name: '',
        type: this.data?.hasRobocall ? CampaignType.voice : CampaignType.sms,
        queueUuid: null,
        createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx"),
        callerId: '',
        callerIdMode: CallerIdMode.fixed,
        previewTime: 60,
        ringTime: 15,
        mode: Mode.progressive,
        ringOption: RingOption.agent,
        checkDnc: false,
        clonedFromCampaignUuid: null,
        includeCampaignNumbers: false
      });
    }
  }

  onRunTimeChange(value, type: 'from' | 'to') {
    const date = new Date(value);

    if (type === 'from') {
      if (!this.runTimeTo) {
        return;
      }

      const to = new Date(this.runTimeTo);
      this.runTimeValid = to >= date;
    } else {
      if (!this.runTimeFrom) {
        return;
      }

      const from = new Date(this.runTimeFrom);
      this.runTimeValid = date >= from;
    }

    if (!this.runTimeTo || !this.runTimeFrom) {
      return;
    }

    setTimeout(() => {
      this.toRef?.control?.setErrors(this.runTimeValid ? null : { runTime: true });
      this.toRef?.control?.markAllAsTouched();
    }, 0);
  }
}
