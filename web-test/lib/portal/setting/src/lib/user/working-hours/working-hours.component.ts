import { Component, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ExtensionBase, MailBoxAction } from '@b3networks/api/bizphone';
import { ExtensionQuery, ScheduleQuery, ScheduleService, ScheduleUW } from '@b3networks/api/callcenter';
import { ShiftData, TimeRange, WeekDay } from '@b3networks/api/ivr';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format, parse } from 'date-fns';
import { Observable } from 'rxjs';
import { distinctUntilKeyChanged, filter, finalize, switchMap, takeUntil } from 'rxjs/operators';

const WOKRING_TIMES = {
  morningFrom: parse('9:00', 'HH:mm', new Date()),
  moringTo: parse('12:00', 'HH:mm', new Date()),
  afternoonFrom: parse('13:00', 'HH:mm', new Date()),
  afternoonTo: parse('18:00', 'HH:mm', new Date()),
  startDay: parse('00:00', 'HH:mm', new Date()),
  endDay: parse('23:59', 'HH:mm', new Date())
};

@Component({
  selector: 'b3n-working-hours',
  templateUrl: './working-hours.component.html',
  styleUrls: ['./working-hours.component.scss']
})
export class WorkingHoursComponent extends DestroySubscriberComponent implements OnInit {
  workingSchedule = this.fb.group({
    shifts: this.fb.array([])
  });
  schedule$: Observable<ScheduleUW>;
  workflow: ScheduleUW;

  loadingView = true;
  progressing: boolean;

  readonly weekDays: WeekDay[] = [
    WeekDay.MONDAY,
    WeekDay.TUESDAY,
    WeekDay.WEDNESDAY,
    WeekDay.THURSDAY,
    WeekDay.FRIDAY,
    WeekDay.SATURDAY,
    WeekDay.SUNDAY
  ];
  readonly MailBoxAction = MailBoxAction;

  get shiftsField() {
    return this.workingSchedule.get('shifts') as UntypedFormArray;
  }

  constructor(
    private fb: UntypedFormBuilder,
    private extensionQuery: ExtensionQuery,
    private scheduleQuery: ScheduleQuery,
    private scheduleService: ScheduleService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit() {
    this.extensionQuery
      .selectActive()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(ext => ext != null),
        distinctUntilKeyChanged('extKey'),
        switchMap((extension: ExtensionBase) => {
          this.scheduleService.getSchedule(extension.identityUuid).subscribe();
          return this.scheduleQuery.selectByIdentityUuid(extension.identityUuid);
        }),
        filter(schedule => schedule != null)
      )
      .subscribe(schedule => {
        if (schedule.shifts) {
          this.workflow = schedule;
          if (this.workflow.timezone == null) {
            this.workflow = {
              ...this.workflow,
              timezone: 'GMT+0800SG'
            };
          }

          this.initForm(this.workflow);
          this.loadingView = false;
        }
      });
  }

  shiftChanged(cShift: UntypedFormGroup) {
    const shiftData = this.workflow?.shifts?.find(shift => shift.dayOfWeek === cShift.controls['dayOfWeek'].value);

    this.initTimeRange(
      cShift.controls['enabled'].value,
      shiftData ? shiftData.timeRanges : [],
      cShift.controls['timeRanges'] as UntypedFormArray
    );
  }

  addMoreRange(timeRanges: UntypedFormArray) {
    timeRanges.push(
      this.fb.group({
        from: [
          {
            value: null,
            disabled: false
          }
        ],
        to: [
          {
            value: null,
            disabled: false
          }
        ]
      })
    );
  }

  format24Hours(timeRanges: UntypedFormArray) {
    timeRanges.clear();
    timeRanges.push(
      this.fb.group({
        from: [
          {
            value: WOKRING_TIMES.startDay,
            disabled: false
          }
        ],
        to: [
          {
            value: WOKRING_TIMES.endDay,
            disabled: false
          }
        ]
      })
    );
  }

  applyWorkTimetoAll(shift: UntypedFormGroup) {
    for (const shiftItem of this.shiftsField.controls) {
      if (shiftItem.value.enabled) {
        const timeRanges = shiftItem.get('timeRanges') as UntypedFormArray;
        const timeRangesShift = shift.controls['timeRanges'] as UntypedFormArray;
        for (let index = 0; index < timeRangesShift.length; index++) {
          const syncData = (shift.controls['timeRanges'] as UntypedFormArray).controls[index];
          if (!!syncData.get('from').value && !!syncData.get('to').value) {
            const range = timeRanges.controls[index] as UntypedFormGroup;
            if (range) {
              range.get('from').setValue(syncData.get('from').value);
              range.get('to').setValue(syncData.get('to').value);
            } else {
              timeRanges.push(
                this.fb.group({
                  from: [
                    {
                      value: syncData.get('from').value,
                      disabled: false
                    }
                  ],
                  to: [
                    {
                      value: syncData.get('to').value,
                      disabled: false
                    }
                  ]
                })
              );
            }
          }
        }

        if (timeRanges.length > timeRangesShift.length) {
          // clear
          while (timeRanges.length > timeRangesShift.length) {
            timeRanges.removeAt(timeRangesShift.length);
          }
        }
      }
    }
  }

  onSave() {
    this.progressing = true;

    let data = Object.assign({}, this.workflow);
    data = Object.assign(data, this.getWorkingFormValue());

    data.shifts = data.shifts.map((shift: ShiftData) => ({
      ...shift,
      timeRanges: shift.timeRanges
        .filter(x => !!x.from && !!x.to)
        .map(
          (time: TimeRange) =>
            <TimeRange>{ from: format(new Date(time.from), 'HH:mm'), to: format(new Date(time.to), 'HH:mm') }
        )
    }));

    this.scheduleService
      .updateSchedule(this.extensionQuery.getActive()?.identityUuid, data)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.toastService.success(`Apply Successfully!`);
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  private getWorkingFormValue(): {} {
    const shiftsData: ShiftData[] = [];

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
            // shifData.timeRanges.push({ from: null, to: null });
          } else {
            shifData.timeRanges.push(
              TimeRange.createInstance(timeGroup.controls['from'].value, timeGroup.controls['to'].value)
            );
          }
        }
      }
      shiftsData.push(shifData);
    }
    const data = this.workingSchedule.value;
    data.shifts = shiftsData;
    return data;
  }

  private initForm(schedule: ScheduleUW) {
    this.workingSchedule = this.fb.group({
      shifts: this.fb.array([])
    });

    this.weekDays.forEach(weekDay => {
      const shiftData = schedule?.shifts?.find(shift => shift.dayOfWeek === weekDay);

      const enabled = shiftData && shiftData.timeRanges.length > 0;
      const shiftForm = this.fb.group({
        dayOfWeek: [weekDay],
        timeRanges: this.initTimeRange(enabled, shiftData ? shiftData.timeRanges : []),
        enabled: [enabled]
      });
      (this.workingSchedule.get('shifts') as UntypedFormArray).push(shiftForm);
    });
  }

  private initTimeRange(enabled: boolean, timeRanges: TimeRange[] = [], fields: UntypedFormArray = this.fb.array([])) {
    fields.controls = [];

    timeRanges.forEach(range => {
      fields.push(
        this.fb.group({
          from: [
            {
              value: range.from ? parse(range.from, 'HH:mm', new Date()) : null,
              disabled: !enabled
            }
          ],
          to: [
            {
              value: range.to ? parse(range.to, 'HH:mm', new Date()) : null,
              disabled: !enabled
            }
          ]
        })
      );
    });
    if (timeRanges.length === 0) {
      fields.push(
        this.fb.group({
          from: [
            {
              value: WOKRING_TIMES.startDay,
              disabled: !enabled
            }
          ],
          to: [
            {
              value: WOKRING_TIMES.endDay,
              disabled: !enabled
            }
          ]
        })
      );
    }

    return fields;
  }
}
