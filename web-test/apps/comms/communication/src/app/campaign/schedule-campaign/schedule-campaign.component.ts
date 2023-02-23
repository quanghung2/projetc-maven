import { DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { CampaignLicenseInfo, CampaignLicenseService, CampaignType } from '@b3networks/api/callcenter';
import { minDateValidator } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { addDays, format } from 'date-fns';
import { format as formatDateFnsTz, utcToZonedTime } from 'date-fns-tz';
import { cloneDeep } from 'lodash';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-schedule-campaign',
  templateUrl: './schedule-campaign.component.html',
  styleUrls: ['./schedule-campaign.component.scss']
})
export class ScheduleCampaignComponent implements OnInit {
  conversionTarget: string;
  processing: boolean;
  numberListData: CampaignLicenseInfo;
  form: UntypedFormGroup;
  campaignMinDate = new Date();
  today: Date;

  readonly min = new Date();
  readonly max = addDays(new Date(), 30);
  readonly CampaignType = CampaignType;

  constructor(
    private campaignService: CampaignLicenseService,
    public dialogRef: MatDialogRef<ScheduleCampaignComponent>,
    private toastService: ToastService,
    @Inject(MAT_DIALOG_DATA) private data: CampaignLicenseInfo,
    private fb: UntypedFormBuilder,
    private datePipe: DatePipe,
    public identityProfile: IdentityProfileQuery
  ) {
    this.numberListData = cloneDeep(this.data);

    const todayTimeWithUTC = formatDateFnsTz(
      utcToZonedTime(new Date(), this.identityProfile.currentOrg.utcOffset),
      "yyyy-MM-dd'T'HH:mm:ssxxx",
      {
        timeZone: this.identityProfile.currentOrg.utcOffset as string
      }
    );

    this.today = new Date(todayTimeWithUTC.split('+').shift());

    if (this.numberListData.fromCampaign) {
      this.campaignMinDate.setHours(0, 0, 0, 0);

      this.form = this.fb.group({
        scheduleAt: ['', minDateValidator(this.today)]
      });

      if (this.numberListData.scheduledAt) {
        this.form.controls['scheduleAt'].setValue(new Date(this.numberListData.scheduledAt));
      }

      this.numberListData.type = CampaignType.outboundContactCenter;
    }
  }

  ngOnInit() {}

  addSchedule(event) {
    const indexSchedule = this.numberListData.listScheduledAt.findIndex(s => s === format(event.value, 'yyyy-MM-dd'));
    if (indexSchedule === -1) {
      this.numberListData.listScheduledAt.push(format(event.value, 'yyyy-MM-dd HH:mm'));
    }
    this.numberListData.listScheduledAt = this.numberListData.listScheduledAt.sort((h1, h2) => h1.localeCompare(h2));
  }

  removeSchedule(i) {
    this.numberListData.listScheduledAt.splice(i, 1);
  }

  onSave() {
    this.processing = true;

    if (this.numberListData.fromCampaign) {
      const scheduleAt = this.form.controls['scheduleAt'].value;

      if (scheduleAt) {
        const time = this.datePipe.transform(scheduleAt, 'HH:mm');
        const date = this.datePipe.transform(scheduleAt, 'yyyy-MM-dd');
        this.numberListData.scheduledAt = `${date} ${time}`;
      } else {
        this.numberListData.scheduledAt = null;
      }
    } else {
      this.numberListData.listScheduledAt = this.formatDate(this.numberListData.listScheduledAt);
    }

    this.campaignService
      .updateCampaignV2(this.numberListData.uuid, this.numberListData)
      .pipe(
        finalize(() => {
          this.processing = false;
        }),
        catchError(err => {
          this.toastService.error(err.message);
          throw err;
        })
      )
      .subscribe(res => {
        this.dialogRef.close(res);
      });
  }

  formatDate(listScheduleAt) {
    const res = [];
    listScheduleAt.forEach(schedule => {
      schedule = format(new Date(schedule), 'yyyy-MM-dd HH:mm');
      res.push(schedule);
    });
    return res;
  }

  clearDate() {
    this.form.controls['scheduleAt'].setValue(null);
  }
}
