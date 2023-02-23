import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatSelect, MAT_SELECT_CONFIG } from '@angular/material/select';
import { Organization, OrganizationQuery } from '@b3networks/api/auth';
import {
  DashboardV2Service,
  DASHBOARD_2_DEFAULT_DATETIMES,
  DATETIME_CUSTOM_WIDTH,
  DATETIME_WIDTH,
  QuestionV2SourceFilter
} from '@b3networks/api/dashboard';
import { DashboardV2AppSettingFilter } from '@b3networks/api/portal';
import { DestroySubscriberComponent, TimeRangeHelper, TimeRangeKey, X } from '@b3networks/shared/common';
import { HashMap } from '@datorama/akita';
import { MatDateRangeInput } from '@matheo/datepicker';
import { subDays } from 'date-fns';
import { debounceTime, filter, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-datetime-filter',
  templateUrl: './datetime-filter.component.html',
  styleUrls: ['./datetime-filter.component.scss'],
  providers: [
    {
      provide: MAT_SELECT_CONFIG,
      useValue: { overlayPanelClass: 'datetime__overlay' }
    }
  ]
})
export class DatetimeFilterComponent extends DestroySubscriberComponent implements OnInit {
  @Input() form: UntypedFormGroup;
  @Input() storedFilter: DashboardV2AppSettingFilter;
  @ViewChild('dateTimeSelect') dateTimeSelect: MatSelect;
  @ViewChild('timeRangeInput') timeRangeInput: MatDateRangeInput<any>;

  org: Organization;
  hasDateTimeFilterV2: boolean;
  fetchedDateTime: boolean;
  maxDate: Date = new Date();
  minDate: Date = subDays(new Date(), 366);

  readonly TimeRangeKey = TimeRangeKey;
  readonly timeRanges = DASHBOARD_2_DEFAULT_DATETIMES;

  constructor(
    private orgQuery: OrganizationQuery,
    private dashboardV2Service: DashboardV2Service,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit() {
    this.timeRange.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(timeRange => {
          return timeRange.startDate && timeRange.endDate;
        }),
        debounceTime(200),
        tap(timeRange => {
          const { start, end } = this.timeRangeInput?.value || { start: null, end: null };
          const { startDate, endDate } = timeRange;
          const startDateIso = new Date(startDate).toISOString();
          const endDateIso = new Date(endDate).toISOString();
          const startIso = new Date(start).toISOString();
          const endIso = new Date(end).toISOString();

          if (startDateIso !== startIso || endDateIso !== endIso) {
            this.timeRange.setValue({ startDate, endDate });
            return;
          }

          this.dashboardV2Service.dateTime$.next(this.getSpecificDate(new Date(startDate), new Date(endDate)));
        })
      )
      .subscribe();

    this.customDate.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        debounceTime(200),
        filter(customDate => !!customDate),
        tap(customDate => {
          this.dashboardV2Service.dateTime$.next(this.getCustomDate(new Date(customDate)));
        })
      )
      .subscribe();

    this.orgQuery
      .selectOrganization(X.orgUuid)
      .pipe(
        filter(org => !!org),
        takeUntil(this.destroySubscriber$),
        tap(org => {
          this.org = new Organization(org);
          this.handleDateTimeFilter();
        })
      )
      .subscribe();
  }

  handleDateTimeFilter() {
    this.dashboardV2Service.dateTimeFilterHash$$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(dateTimeFilterHash => {
          this.checkHasDateTimeFilterV2(dateTimeFilterHash);

          if (this.hasDateTimeFilterV2 && !this.fetchedDateTime) {
            this.fetchedDateTime = true;

            this.dateTime.valueChanges
              .pipe(
                takeUntil(this.destroySubscriber$),
                tap((timeRangeKey: TimeRangeKey) => {
                  const currValue = this.dateTimeSelect.value as TimeRangeKey;

                  if (timeRangeKey !== currValue) {
                    this.dateTime.setValue(timeRangeKey);
                    return;
                  }

                  this.dashboardV2Service.setFiltersWidthHash(
                    QuestionV2SourceFilter.DATETIME,
                    [TimeRangeKey.specific_date, TimeRangeKey.custom_date].includes(this.dateTime.value)
                      ? DATETIME_CUSTOM_WIDTH
                      : DATETIME_WIDTH
                  );

                  if (timeRangeKey === TimeRangeKey.specific_date) {
                    this.customDate.reset();
                    return;
                  }

                  if (timeRangeKey !== TimeRangeKey.custom_date) {
                    this.dashboardV2Service.dateTime$.next(this.getTimeRange(timeRangeKey));
                    this.customDate.reset();
                    this.timeRange.reset();
                    return;
                  }

                  if (this.customDate.value) {
                    this.dashboardV2Service.dateTime$.next(this.getCustomDate(this.customDate.value));
                  } else {
                    this.customDate.setValue(new Date());
                  }

                  this.timeRange.reset();
                })
              )
              .subscribe();

            this.dateTime.setValue(this.storedFilter?.dateTime ? this.storedFilter.dateTime : this.timeRanges[0].key);

            if (this.storedFilter?.dateTime === TimeRangeKey.specific_date) {
              if (this.storedFilter?.timeRange?.endDate && this.storedFilter?.timeRange?.startDate) {
                this.timeRange.setValue(this.storedFilter?.timeRange);
              } else {
                this.dateTime.setValue(TimeRangeKey['24h']);
              }
            }
          }
        })
      )
      .subscribe();
  }

  checkHasDateTimeFilterV2(dateTimeFilterHash: HashMap<boolean>) {
    this.hasDateTimeFilterV2 = false;
    const keys = Object.keys(dateTimeFilterHash);

    keys.every(uuid => {
      if (dateTimeFilterHash[uuid]) {
        this.hasDateTimeFilterV2 = true;
        this.dashboardV2Service.setFiltersWidthHash(
          QuestionV2SourceFilter.DATETIME,
          [TimeRangeKey.specific_date, TimeRangeKey.custom_date].includes(this.dateTime.value)
            ? DATETIME_CUSTOM_WIDTH
            : DATETIME_WIDTH
        );

        return false;
      }

      return true;
    });

    this.cdr.detectChanges();
  }

  getTimeRange(timeRangeKey: TimeRangeKey) {
    const { startDate, endDate } = TimeRangeHelper.buildTimeRangeFromKey(timeRangeKey, this.org.utcOffset);

    return {
      timeRangeKey: timeRangeKey,
      startTime: startDate,
      endTime: endDate
    };
  }

  getCustomDate(date: Date) {
    const { startDate, endDate } = TimeRangeHelper.buildCustomDate(date, this.org.utcOffset);

    return {
      timeRangeKey: TimeRangeKey.custom_date,
      startTime: startDate,
      endTime: endDate
    };
  }

  getSpecificDate(start: Date, end: Date) {
    const { startDate, endDate } = TimeRangeHelper.buildSpecificDate(start, end, this.org.utcOffset);

    return {
      timeRangeKey: TimeRangeKey.specific_date,
      startTime: startDate,
      endTime: endDate
    };
  }

  get dateTime() {
    return this.form?.controls['dateTime'];
  }

  get timeRange() {
    return this.form?.controls['timeRange'] as UntypedFormGroup;
  }

  get customDate() {
    return this.form?.controls['customDate'];
  }
}
