import { Component, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CountryService } from '@b3networks/api/auth';
import { ShiftData, TimeRange, WeekDay, Workflow, WorkflowService } from '@b3networks/api/ivr';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format, parse } from 'date-fns';
import { finalize } from 'rxjs/operators';

const WOKRING_TIMES = {
  morningFrom: parse('9:00', 'HH:mm', new Date()),
  moringTo: parse('12:00', 'HH:mm', new Date()),
  afternoonFrom: parse('13:00', 'HH:mm', new Date()),
  afternoonTo: parse('18:00', 'HH:mm', new Date()),
  startDay: parse('00:00', 'HH:mm', new Date()),
  endDay: parse('23:59', 'HH:mm', new Date())
};

@Component({
  selector: 'b3n-worktime',
  templateUrl: './worktime.component.html',
  styleUrls: ['./worktime.component.scss']
})
export class WorktimeComponent implements OnInit {
  readonly weekDays: WeekDay[] = [
    WeekDay.MONDAY,
    WeekDay.TUESDAY,
    WeekDay.WEDNESDAY,
    WeekDay.THURSDAY,
    WeekDay.FRIDAY,
    WeekDay.SATURDAY,
    WeekDay.SUNDAY
  ];

  workflow: Workflow;

  workingSchedule = this.fb.group({
    shifts: this.fb.array([])
  });

  progressing: boolean;
  loadingView = false;

  get shiftsField() {
    return this.workingSchedule?.get('shifts') as UntypedFormArray;
  }

  constructor(
    private countryService: CountryService,
    private workflowService: WorkflowService,
    private route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.parent.params.subscribe(params => {
      this.workflowService.getWorkflow(params['uuid']).subscribe(w => {
        this.workflow = w;
        this.initForm(this.workflow);
      });
    });

    this.countryService.getCountry().subscribe();
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

  shiftChanged(cShift: UntypedFormGroup) {
    const shiftData = this.workflow.rule.shifts.find(shift => shift.dayOfWeek === cShift.controls['dayOfWeek'].value);
    this.initTimeRange(
      cShift.controls['enabled'].value,
      shiftData ? shiftData.timeRanges : [],
      cShift.controls['timeRanges'] as UntypedFormArray
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

  progress() {
    this.progressing = true;
    const data = Object.assign({}, this.workflow);
    data.rule = Object.assign(data.rule, this.getWorkingFormValue());
    data.rule.shifts = data.rule.shifts.map((shift: ShiftData) => ({
      ...shift,
      timeRanges: shift.timeRanges
        .filter(x => !!x.from && !!x.to)
        .map(
          (time: TimeRange) =>
            <TimeRange>{ from: format(new Date(time.from), 'HH:mm'), to: format(new Date(time.to), 'HH:mm') }
        )
    }));
    this.workflowService
      .updateWorkflow(this.workflow.uuid, data)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        workflow => {
          this.workflow = workflow;
          this.toastService.success(`Update working time successfully!`);
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

  private initForm(workflow: Workflow) {
    this.workingSchedule = this.fb.group({
      shifts: this.fb.array([])
    });

    this.weekDays.forEach(weekDay => {
      const shiftData = workflow?.rule?.shifts?.find(shift => shift.dayOfWeek === weekDay);

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
