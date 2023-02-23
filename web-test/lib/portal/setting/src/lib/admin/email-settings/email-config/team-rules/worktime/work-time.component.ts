import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TimeRange, WeekDay, WorkflowService } from '@b3networks/api/ivr';
import { EmailRule, WorkingDay } from '@b3networks/api/workspace';
import { format, parse } from 'date-fns';

const WORKING_TIMES = {
  morningFrom: parse('9:00 AM', 'hh:mm a', new Date()),
  morningTo: parse('12:00 AM', 'hh:mm a', new Date()),
  afternoonFrom: parse('1:00 PM', 'hh:mm a', new Date()),
  afternoonTo: parse('6:00 PM', 'hh:mm a', new Date())
};

@Component({
  selector: 'b3n-work-time',
  templateUrl: './work-time.component.html',
  styleUrls: ['./work-time.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkTimeComponent implements OnInit {
  @Input() rule: EmailRule;
  @Output() ruleChange: EventEmitter<EmailRule> = new EventEmitter();

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
  progressing: boolean;
  loaded: boolean;

  get shiftsField() {
    return this.workingSchedule.get('shifts') as UntypedFormArray;
  }

  constructor(
    private dialogRef: MatDialogRef<WorkTimeComponent>,
    private workflowService: WorkflowService,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit() {
    this.initForm();
    this.workingSchedule.valueChanges.subscribe(() => {
      this.rule = this.parseWorkFormValue();
      this.ruleChange.emit(this.rule);
    });
  }

  shiftChanged(cShift: any) {
    const shiftData = this.rule.workingDays.find(shift => shift.day === cShift.controls.day.value);
    this.initTimeRange(
      cShift.controls.enabled.value,
      shiftData ? shiftData.timeRanges : [],
      cShift.controls.timeRanges as UntypedFormArray
    );
  }

  applyWorkTimeToAll(shift: any) {
    for (const shiftItem of this.shiftsField.controls) {
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

  private parseWorkFormValue() {
    this.progressing = true;
    const rule: EmailRule = { ...this.rule, workingDays: this.getWorkingFormValue() };
    rule.workingDays.forEach(shift => {
      if (shift.timeRanges.length > 0) {
        if (shift.timeRanges[0] && shift.timeRanges[0].from && shift.timeRanges[0].to) {
          shift.timeRanges[0].from = shift.timeRanges[0].from
            ? format(new Date(shift.timeRanges[0].from), 'hh:mm a')
            : null;
          shift.timeRanges[0].to = shift.timeRanges[0].to ? format(new Date(shift.timeRanges[0].to), 'hh:mm a') : null;
        }
        if (shift.timeRanges[1] && shift.timeRanges[1].from && shift.timeRanges[1].to) {
          shift.timeRanges[1].from = shift.timeRanges[1].from
            ? format(new Date(shift.timeRanges[1].from), 'hh:mm a')
            : null;
          shift.timeRanges[1].to = shift.timeRanges[1].to ? format(new Date(shift.timeRanges[1].to), 'hh:mm a') : null;
        }
      }
    });
    return rule;
  }

  private getWorkingFormValue(): WorkingDay[] {
    const workingDays: WorkingDay[] = [];
    const shifts = this.workingSchedule.controls['shifts'] as UntypedFormArray;
    for (const cShift of shifts.controls) {
      const shiftGroup = cShift as UntypedFormGroup;
      const workingDay: WorkingDay = new WorkingDay();
      workingDay.day = shiftGroup.controls['day'].value;
      workingDay.isWorkingDay = shiftGroup.controls['enabled'].value;
      if (workingDay.isWorkingDay) {
        const timeRanges = shiftGroup.controls['timeRanges'] as UntypedFormArray;
        for (const timeRange of timeRanges.controls) {
          const timeGroup = timeRange as UntypedFormGroup;
          if (timeGroup.controls['from'].value == null || timeGroup.controls['to'].value == null) {
            workingDay.timeRanges.push({ from: null, to: null });
          } else {
            workingDay.timeRanges.push(
              TimeRange.createInstance(timeGroup.controls['from'].value, timeGroup.controls['to'].value)
            );
          }
        }
      }
      workingDays.push(workingDay);
    }
    return workingDays;
  }

  private initForm() {
    this.workingSchedule = this.fb.group({
      shifts: this.fb.array([])
    });

    this.shiftsField.controls = [];

    this.weekDays.forEach(weekDay => {
      let shiftData: WorkingDay = this.rule.workingDays.find(
        workingDay => workingDay.day.toLowerCase() === weekDay.toLowerCase()
      );
      if (!shiftData) {
        shiftData = {
          day: weekDay,
          isWorkingDay: false,
          timeRanges: []
        };
      }

      const shiftForm = this.fb.group({
        day: [shiftData.day],
        timeRanges: this.initTimeRange(shiftData.isWorkingDay, shiftData ? shiftData.timeRanges : []),
        enabled: [shiftData.isWorkingDay]
      });
      this.shiftsField.push(shiftForm);
    });
  }

  private initTimeRange(enabled: boolean, timeRanges: TimeRange[] = [], fields: UntypedFormArray = this.fb.array([])) {
    fields.controls = [];
    if (timeRanges.length < 2) {
      for (let i = 0, len = 2 - timeRanges.length; i < len; i++) {
        if (i === 0) {
          fields.push(
            this.fb.group({
              from: [{ value: enabled && len === 2 ? WORKING_TIMES.morningFrom : null, disabled: !enabled }],
              to: [{ value: enabled && len === 2 ? WORKING_TIMES.morningTo : null, disabled: !enabled }]
            })
          );
        } else {
          fields.push(
            this.fb.group({
              from: [{ value: enabled && len === 2 ? WORKING_TIMES.afternoonFrom : null, disabled: !enabled }],
              to: [{ value: enabled && len === 2 ? WORKING_TIMES.afternoonTo : null, disabled: !enabled }]
            })
          );
        }
      }
    } else {
      timeRanges.forEach(range => {
        fields.push(
          this.fb.group({
            from: [
              {
                value: enabled && range.from ? parse(range.from, 'hh:mm a', new Date()) : null,
                disabled: !enabled
              }
            ],
            to: [
              {
                value: enabled && range.to ? parse(range.to, 'hh:mm a', new Date()) : null,
                disabled: !enabled
              }
            ]
          })
        );
      });
    }
    return fields;
  }
}
