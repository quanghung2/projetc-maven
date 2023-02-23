import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { Country, CountryQuery, CountryService, IdentityProfileQuery } from '@b3networks/api/auth';
import { Holiday, ShiftData, TimeRange, WeekDay, Workflow, WorkflowService } from '@b3networks/api/ivr';
import { HolidayService } from '@b3networks/api/leave';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format, getYear, parse } from 'date-fns';
import * as $ from 'jquery';
import { combineLatest, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { timeZones } from '../../core/timezones';

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
  workingSchedule: UntypedFormGroup;

  holidayCountries$: Observable<Country[]>;

  publicHolidaysInYear: KeyValue<string, Holiday[]>[] = [];
  holidays: Holiday[] = [];

  selectedCalendarCode: string;
  progressing: boolean;
  timeZones: any;
  loadingPublicHoliday: boolean;
  loaded: boolean;
  licenseEnabled: boolean;

  get shiftsField() {
    return this.workingSchedule.get('shifts') as UntypedFormArray;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Workflow,
    private dialogRef: MatDialogRef<WorktimeComponent>,
    private workflowService: WorkflowService,
    private holidayService: HolidayService,
    private fb: UntypedFormBuilder,
    private toastService: ToastService,
    private spinner: LoadingSpinnerSerivce,
    private profileQuery: IdentityProfileQuery,
    private countryQuery: CountryQuery,
    private countryService: CountryService
  ) {
    this.spinner.showSpinner();
    if (data.rule.timezone == null) {
      data.rule.timezone = 'GMT+0800SG';
    }
    this.workflow = new Workflow(data);
    this.initForm();
    this.timeZones = timeZones;
  }

  ngOnInit() {
    this.holidayCountries$ = combineLatest([
      this.countryQuery.countries$,
      this.holidayService.getSupportedHolidayContries()
    ]).pipe(
      map(([countries, phCountries]) => {
        return countries.filter(c => phCountries.includes(c.code));
      })
    );

    this.countryService.getCountry().subscribe();

    // this.

    this.holidayService
      .fetchHolidays(this.workflow.rule.holidayCode, getYear(new Date()))
      .pipe(
        finalize(() => {
          this.spinner.hideSpinner();
          this.loaded = true;
        })
      )
      .subscribe(
        holidays => {
          const convertedHolidays = holidays.map(h => new Holiday({ date: h.date, name: h.description }));
          this.holidays = convertedHolidays;
          this.selectedCalendarCode = this.workflow.rule.holidayCode;

          this.publicHolidaysInYear.push({
            key: this.workflow.rule.holidayCode,
            value: convertedHolidays
          });
        },
        err => {
          this.toastService.error(err.message || `Cannot fetch holidays. Please try again later.`);
        }
      );
    this.licenseEnabled = this.profileQuery.currentOrg.licenseEnabled;
  }

  async onCalendarChanged(event: MatSelectChange) {
    this.selectedCalendarCode = event.value;
    const calendar = this.publicHolidaysInYear.find(holiday => holiday.key === event.value);
    if (!calendar) {
      this.loadingPublicHoliday = true;
      await this.holidayService
        .fetchHolidays(event.value, getYear(new Date()))
        .pipe(finalize(() => (this.loadingPublicHoliday = false)))
        .toPromise()
        .then(
          holidays => {
            const convertedHolidays = holidays.map(h => new Holiday({ date: h.date, name: h.description }));
            this.publicHolidaysInYear.push({
              key: event.value,
              value: convertedHolidays
            });
            this.holidays = Object.assign([], convertedHolidays);
          },
          err => this.toastService.error(`Cannot fetch holidays. Please try again later!`)
        );
    } else {
      this.holidays = calendar.value;
    }
  }

  addHighlightClass(index: number, type: string) {
    $(document).ready(function () {
      return type === 'custom'
        ? document.getElementById(`chip_${index}`).classList.add('highlight')
        : document.getElementById(`chip_public_${index}`).classList.add('highlight');
    });
  }

  progress() {
    this.progressing = true;
    if (this.selectedCalendarCode === 'none') {
      this.workflow.rule.autoImportHolidays = false;
    }
    const data = Object.assign({}, this.workflow);
    data.rule = Object.assign(data.rule, this.getWorkingFormValue());
    data.rule.holidays = this.selectedCalendarCode !== 'none' ? this.holidays : [];
    data.rule.holidays = data.rule.holidays.concat(this.holidays);
    data.rule.shifts.forEach((shift: ShiftData) => {
      if (shift.timeRanges.length > 0) {
        if (shift.timeRanges[0].from == null || shift.timeRanges[0].to == null) {
          shift.timeRanges[0] = shift.timeRanges[1];
          shift.timeRanges[1] = <TimeRange>{ from: null, to: null };
        }
        shift.timeRanges[0].from = shift.timeRanges[0].from
          ? format(new Date(shift.timeRanges[0].from), 'HH:mm')
          : null;
        shift.timeRanges[0].to = shift.timeRanges[0].to ? format(new Date(shift.timeRanges[0].to), 'HH:mm') : null;
        shift.timeRanges[1].from = shift.timeRanges[1].from
          ? format(new Date(shift.timeRanges[1].from), 'HH:mm')
          : null;
        shift.timeRanges[1].to = shift.timeRanges[1].to ? format(new Date(shift.timeRanges[1].to), 'HH:mm') : null;
      }
    });
    this.workflowService
      .updateWorkflow(this.workflow.uuid, data)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        workflow => {
          this.dialogRef.close(workflow);
          this.toastService.success(`Completed!`);
        },
        error => {
          this.toastService.error(error.message);
        }
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

  applyWorkTimetoAll(shift: any) {
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
            shifData.timeRanges.push({ from: null, to: null });
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

  private initForm() {
    this.workingSchedule = this.fb.group({
      holidayCode: [this.workflow.rule.holidayCode, Validators.required],
      shifts: this.fb.array([])
    });

    this.shiftsField.controls = [];

    this.weekDays.forEach(weekDay => {
      const shiftData = this.workflow.rule.shifts.find(shift => shift.dayOfWeek === weekDay);

      const enabled = shiftData && shiftData.timeRanges.length > 0;

      const shiftForm = this.fb.group({
        dayOfWeek: [weekDay],
        timeRanges: this.initTimeRange(enabled, shiftData ? shiftData.timeRanges : []),
        enabled: [enabled]
      });
      this.shiftsField.push(shiftForm);
    });
  }

  private initTimeRange(enabled: boolean, timeRanges: TimeRange[] = [], fields: UntypedFormArray = this.fb.array([])) {
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

  onChangeTimezone(timezone) {
    this.workflow.rule.timezone = timezone;
  }

  checkBoxChanged(checked: boolean) {
    this.workflow.rule.autoImportHolidays = checked;
  }
}
