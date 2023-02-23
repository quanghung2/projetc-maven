import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Country, CountryQuery } from '@b3networks/api/auth';
import { ExtensionQuery, ScheduleQuery } from '@b3networks/api/callcenter';
import { Holiday } from '@b3networks/api/ivr';
import { HolidayService } from '@b3networks/api/leave';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-admin-tools-public-holiday',
  templateUrl: './admin-tools-public-holiday.component.html',
  styleUrls: ['./admin-tools-public-holiday.component.scss']
})
export class AdminToolsPublicHolidayComponent extends DestroySubscriberComponent implements OnInit {
  countries$: Observable<Country[]>;
  holidays: Holiday[];
  formConfig: UntypedFormGroup;
  updating: boolean;

  constructor(
    private fb: UntypedFormBuilder,
    private holidayService: HolidayService,
    private countryQuery: CountryQuery,
    private scheduleQuery: ScheduleQuery,
    private extensionQuery: ExtensionQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.countries$ = combineLatest([
      this.countryQuery.countries$,
      this.holidayService.getSupportedHolidayContries()
    ]).pipe(
      map(([countries, phCountries]) => {
        return countries.filter(c => phCountries.includes(c.code));
      })
    );

    this.formConfig = this.fb.group({
      phCountryCode: ['']
    });

    this.scheduleQuery
      .selectByIdentityUuid(this.extensionQuery.getActive()?.identityUuid)
      .pipe(
        filter(x => x != null),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(schedule => {
        this.formConfig.get('phCountryCode').setValue(schedule.phCountryCode);
        this.formConfig.markAsPristine();
      });
  }
}
