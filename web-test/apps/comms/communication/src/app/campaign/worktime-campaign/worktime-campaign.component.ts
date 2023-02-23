import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CampaignLicenseInfo, CampaignLicenseService } from '@b3networks/api/callcenter';
import { ShiftData, TimeRange, WeekDay } from '@b3networks/api/ivr';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format, parse } from 'date-fns';
import { finalize } from 'rxjs/operators';

export interface WorktimeCampaignInput {
  numberListData: CampaignLicenseInfo;
}

const WOKRING_TIMES = {
  morningFrom: parse('9:00', 'HH:mm', new Date()),
  moringTo: parse('12:00', 'HH:mm', new Date()),
  afternoonFrom: parse('13:00', 'HH:mm', new Date()),
  afternoonTo: parse('18:00', 'HH:mm', new Date())
};

@Component({
  selector: 'b3n-worktime-campaign',
  templateUrl: './worktime-campaign.component.html',
  styleUrls: ['./worktime-campaign.component.scss']
})
export class WorktimeCampaignComponent extends DestroySubscriberComponent implements OnInit {
  readonly weekDays: WeekDay[] = [
    WeekDay.MONDAY,
    WeekDay.TUESDAY,
    WeekDay.WEDNESDAY,
    WeekDay.THURSDAY,
    WeekDay.FRIDAY,
    WeekDay.SATURDAY,
    WeekDay.SUNDAY
  ];
  workingSchedule: UntypedFormGroup;
  officeHours: { [key: string]: TimeRange[] };

  progressing: boolean;
  loaded: boolean;

  constructor(
    private campaignService: CampaignLicenseService,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<WorktimeCampaignComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WorktimeCampaignInput,
    private fb: UntypedFormBuilder
  ) {
    super();
    if (this.data?.numberListData) {
      this.officeHours = this.data.numberListData.officeHours || {
        FRIDAY: [],
        MONDAY: [],
        SATURDAY: [],
        SUNDAY: [],
        THURSDAY: [],
        TUESDAY: [],
        WEDNESDAY: []
      };
      this.initForm();
    }
  }

  ngOnInit() {}

  progress() {
    this.progressing = true;
    this.getWorkingFormValue();

    Object.keys(this.officeHours).forEach(key => {
      const dayOfWeek = this.officeHours[key];
      if (dayOfWeek.length > 0) {
        dayOfWeek[0].from = dayOfWeek[0].from ? format(new Date(dayOfWeek[0].from), 'HH:mm') : null;
        dayOfWeek[0].to = dayOfWeek[0].to ? format(new Date(dayOfWeek[0].to), 'HH:mm') : null;
        dayOfWeek[1].from = dayOfWeek[1].from ? format(new Date(dayOfWeek[1].from), 'HH:mm') : null;
        dayOfWeek[1].to = dayOfWeek[1].to ? format(new Date(dayOfWeek[1].to), 'HH:mm') : null;
      }
    });

    this.data.numberListData.officeHours = this.officeHours;
    this.campaignService
      .updateCampaignV2(this.data.numberListData.uuid, this.data.numberListData)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        () => {
          this.toastService.success(`Completed!`);
          this.dialogRef.close();
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  shiftChanged(cShift: UntypedFormGroup) {
    const shiftData = this.officeHours[cShift.get('dayOfWeek').value];
    this.initTimeRange(cShift.get('enabled').value, shiftData, cShift.get('timeRanges') as UntypedFormArray);
  }

  applyWorkTimetoAll(shift: any) {
    for (const shiftItem of this.workingSchedule.get('shifts')['controls']) {
      if (shiftItem.value.enabled) {
        const timeRanges = shiftItem.get('timeRanges') as UntypedFormArray;
        for (let index = 0; index < 2; index++) {
          const range = timeRanges.controls[index] as UntypedFormGroup;
          const syncData = shift.controls.timeRanges.controls[index];
          range.get('from').setValue(syncData.get('from').value);
          range.get('to').setValue(syncData.get('to').value);
        }
      }
    }
  }

  private getWorkingFormValue(): void {
    const shifts = this.workingSchedule.get('shifts') as UntypedFormArray;
    for (const cShift of shifts.controls) {
      const shiftGroup = cShift as UntypedFormGroup;
      const shifData = new ShiftData();
      shifData.dayOfWeek = shiftGroup.get('dayOfWeek').value;
      if (shiftGroup.get('enabled').value) {
        const timeRanges = shiftGroup.get('timeRanges') as UntypedFormArray;
        for (const timeRange of timeRanges.controls) {
          const timeGroup = timeRange as UntypedFormGroup;
          if (timeGroup.get('from').value == null || timeGroup.get('to').value == null) {
            shifData.timeRanges.push({ from: null, to: null });
          } else {
            shifData.timeRanges.push({ from: timeGroup.get('from').value, to: timeGroup.get('to').value });
          }
        }
      }
      this.officeHours[shifData.dayOfWeek] = shifData.timeRanges;
    }
  }

  private initForm() {
    this.workingSchedule = this.fb.group({
      shifts: this.fb.array([])
    });

    this.workingSchedule.get('shifts')['controls'] = [];

    this.weekDays.forEach(weekDay => {
      const shiftData = this.officeHours[weekDay];
      const enabled = shiftData && shiftData.length > 0;

      const shiftForm = this.fb.group({
        dayOfWeek: [weekDay],
        timeRanges: this.initTimeRange(enabled, shiftData ? shiftData : []),
        enabled: [enabled]
      });
      this.workingSchedule.get('shifts')['controls'].push(shiftForm);
    });
  }

  private initTimeRange(enabled: boolean, timeRanges: TimeRange[], fields: UntypedFormArray = this.fb.array([])) {
    fields.controls = [];

    timeRanges.forEach(range => {
      fields.push(
        this.fb.group({
          from: [
            {
              value: enabled && range.from ? parse(range.from, 'HH:mm', new Date()) : null,
              disabled: !enabled
            }
          ],
          to: [
            {
              value: enabled && range.to ? parse(range.to, 'HH:mm', new Date()) : null,
              disabled: !enabled
            }
          ]
        })
      );
    });

    if (timeRanges.length < 2) {
      for (let i = 0, len = 2 - timeRanges.length; i < len; i++) {
        if (i === 0) {
          fields.push(
            this.fb.group({
              from: [{ value: enabled && len === 2 ? WOKRING_TIMES.morningFrom : null, disabled: !enabled }],
              to: [{ value: enabled && len === 2 ? WOKRING_TIMES.moringTo : null, disabled: !enabled }]
            })
          );
        } else {
          fields.push(
            this.fb.group({
              from: [{ value: enabled && len === 2 ? WOKRING_TIMES.afternoonFrom : null, disabled: !enabled }],
              to: [{ value: enabled && len === 2 ? WOKRING_TIMES.afternoonTo : null, disabled: !enabled }]
            })
          );
        }
      }
    }
    return fields;
  }
}
