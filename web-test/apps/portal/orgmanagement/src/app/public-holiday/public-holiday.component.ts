import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Country, CountryQuery, CountryService } from '@b3networks/api/auth';
import { ScheduleService, ScheduleUW } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import {
  UpdateCustomHolidayComponent,
  UpdateCustomHolidayData
} from './update-custom-holiday/update-custom-holiday.component';
import { UpdatePublicHolidayComponent } from './update-public-holiday/update-public-holiday.component';

@Component({
  selector: 'b3n-public-holiday',
  templateUrl: './public-holiday.component.html',
  styleUrls: ['./public-holiday.component.scss']
})
export class PublicHolidayComponent extends DestroySubscriberComponent implements OnInit {
  loading: boolean;
  scheduleOrg: ScheduleUW;
  countries: Country[];

  constructor(
    private dialog: MatDialog,
    private scheduleService: ScheduleService,
    private countryQuery: CountryQuery,
    private countryService: CountryService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.loading = true;

    // orgConfigService called from outside
    combineLatest([this.scheduleService.getScheduleOrg(), this.countryQuery.countries$])
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(([scheduleOrg, countries]) => {
          this.scheduleOrg = scheduleOrg;
          this.countries = countries;
        }),
        tap(() => (this.loading = false))
      )
      .subscribe();
    this.countryService.getCountry().subscribe();
  }

  getCountryName(countryCode: string): string {
    if (!!this.countries) {
      const country: Country = this.countries.find(c => c.code === countryCode);
      if (!!country) {
        return country.name;
      }
    }
    return '';
  }

  openPublicHolidayConfig() {
    this.dialog
      .open(UpdatePublicHolidayComponent, {
        width: '500px',
        disableClose: true,
        data: this.scheduleOrg
      })
      .afterClosed()
      .subscribe((res: ScheduleUW) => {
        if (res) {
          this.scheduleOrg.phCountryCode = res.phCountryCode;
        }
      });
  }

  openCustomHolidayConfig() {
    this.dialog
      .open(UpdateCustomHolidayComponent, {
        width: '600px',
        disableClose: true,
        data: <UpdateCustomHolidayData>{
          scheduleOrg: this.scheduleOrg
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.scheduleService.getScheduleOrg().subscribe(org => (this.scheduleOrg = org));
        }
      });
  }
}
