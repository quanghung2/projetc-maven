import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CampaignInfo, CampaignService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { addDays, format } from 'date-fns';
import { cloneDeep } from 'lodash';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-schedule-number-list',
  templateUrl: './schedule-number-list.component.html',
  styleUrls: ['./schedule-number-list.component.scss']
})
export class ScheduleNumberListComponent implements OnInit {
  conversionTarget: string;
  processing: boolean;
  numberListData: CampaignInfo;
  readonly min = new Date();
  readonly max = addDays(new Date(), 30);

  constructor(
    private campaignService: CampaignService,
    public dialogRef: MatDialogRef<ScheduleNumberListComponent>,
    private toastService: ToastService,
    @Inject(MAT_DIALOG_DATA) private data: CampaignInfo
  ) {
    this.numberListData = cloneDeep(this.data);
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
    this.numberListData.listScheduledAt = this.formatDate(this.numberListData.listScheduledAt);
    this.campaignService
      .updateCampaign(this.numberListData.uuid, this.numberListData)
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
    let res = [];
    listScheduleAt.forEach(schedule => {
      schedule = format(new Date(schedule), 'yyyy-MM-dd HH:mm');
      res.push(schedule);
    });
    return res;
  }
}
