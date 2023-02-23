import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { OrgConfig, OrgConfigQuery, OrgConfigService } from '@b3networks/api/callcenter';
import { ShiftData, TimeRange, WeekDay } from '@b3networks/api/ivr';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format, parse } from 'date-fns';
import { finalize, takeUntil } from 'rxjs/operators';

const WOKRING_TIMES = {
  morningFrom: parse('9:00', 'HH:mm', new Date()),
  moringTo: parse('12:00', 'HH:mm', new Date()),
  afternoonFrom: parse('13:00', 'HH:mm', new Date()),
  afternoonTo: parse('18:00', 'HH:mm', new Date())
};
@Component({
  selector: 'b3n-worktime',
  templateUrl: './worktime.component.html',
  styleUrls: ['./worktime.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WorktimeComponent extends DestroySubscriberComponent implements OnInit {
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
  OrgConfig: OrgConfig;

  progressing: boolean;
  loaded: boolean;

  constructor(
    private orgConfigQuery: OrgConfigQuery,
    private orgConfigService: OrgConfigService,
    private fb: UntypedFormBuilder,
    private toastService: ToastService,
    private spinner: LoadingSpinnerSerivce
  ) {
    super();
  }

  ngOnInit() {
    this.spinner.showSpinner();
    this.orgConfigQuery.orgConfig$.pipe(takeUntil(this.destroySubscriber$)).subscribe(config => {
      this.OrgConfig = config;
      this.initForm();
      this.spinner.hideSpinner();
      this.loaded = true;
    });

    this.orgConfigService.getConfig().subscribe();
  }

  progress() {
    this.progressing = true;
    this.getWorkingFormValue();
    for (const dayOfWeek in this.OrgConfig.officeHours) {
      const timeRangeOfDay = this.OrgConfig.officeHours[dayOfWeek];
      if (timeRangeOfDay.length > 0) {
        timeRangeOfDay[0].from = timeRangeOfDay[0].from ? format(new Date(timeRangeOfDay[0].from), 'HH:mm') : null;
        timeRangeOfDay[0].to = timeRangeOfDay[0].to ? format(new Date(timeRangeOfDay[0].to), 'HH:mm') : null;
        timeRangeOfDay[1].from = timeRangeOfDay[1].from ? format(new Date(timeRangeOfDay[1].from), 'HH:mm') : null;
        timeRangeOfDay[1].to = timeRangeOfDay[1].to ? format(new Date(timeRangeOfDay[1].to), 'HH:mm') : null;
      }
    }
    this.orgConfigService
      .updateConfig(this.OrgConfig)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        org => {
          this.toastService.success(`Completed!`);
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  shiftChanged(cShift: UntypedFormGroup) {
    const shiftData = this.OrgConfig.officeHours[cShift.controls['dayOfWeek'].value];
    this.initTimeRange(cShift.controls['enabled'].value, shiftData, cShift.controls['timeRanges'] as UntypedFormArray);
  }

  applyWorkTimetoAll(shift: any) {
    for (const shiftItem of this.workingSchedule.controls['shifts']['controls']) {
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
    const shifts = this.workingSchedule.controls['shifts'] as UntypedFormArray;
    for (const cShift of shifts.controls) {
      const shiftGroup = cShift as UntypedFormGroup;
      const shifData = new ShiftData();
      shifData.dayOfWeek = shiftGroup.controls['dayOfWeek'].value;
      if (shiftGroup.controls['enabled'].value) {
        const timeRanges = shiftGroup.controls['timeRanges'] as UntypedFormArray;
        for (const timeRange of timeRanges.controls) {
          const timeGroup = timeRange as UntypedFormGroup;
          if (timeGroup.controls['from'].value == null || timeGroup.controls['to'].value == null) {
            shifData.timeRanges.push({ from: null, to: null });
          } else {
            shifData.timeRanges.push({ from: timeGroup.controls['from'].value, to: timeGroup.controls['to'].value });
          }
        }
      }
      this.OrgConfig.officeHours[shifData.dayOfWeek] = shifData.timeRanges;
    }
  }

  private initForm() {
    this.workingSchedule = this.fb.group({
      shifts: this.fb.array([])
    });

    this.workingSchedule.controls['shifts']['controls'] = [];

    this.weekDays.forEach(weekDay => {
      const shiftData = this.OrgConfig.officeHours[weekDay];
      const enabled = shiftData && shiftData.length > 0;

      const shiftForm = this.fb.group({
        dayOfWeek: [weekDay],
        timeRanges: this.initTimeRange(enabled, shiftData ? shiftData : []),
        enabled: [enabled]
      });
      this.workingSchedule.controls['shifts']['controls'].push(shiftForm);
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
              from: [{ value: enabled && len == 2 ? WOKRING_TIMES.morningFrom : null, disabled: !enabled }],
              to: [{ value: enabled && len == 2 ? WOKRING_TIMES.moringTo : null, disabled: !enabled }]
            })
          );
        } else {
          fields.push(
            this.fb.group({
              from: [{ value: enabled && len == 2 ? WOKRING_TIMES.afternoonFrom : null, disabled: !enabled }],
              to: [{ value: enabled && len == 2 ? WOKRING_TIMES.afternoonTo : null, disabled: !enabled }]
            })
          );
        }
      }
    }
    return fields;
  }
}
