import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Country, CountryQuery } from '@b3networks/api/auth';
import { ScheduleService, ScheduleUW } from '@b3networks/api/callcenter';
import { Holiday, HolidayService } from '@b3networks/api/leave';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest, Observable } from 'rxjs';
import { finalize, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'b3n-update-public-holiday',
  templateUrl: './update-public-holiday.component.html',
  styleUrls: ['./update-public-holiday.component.scss']
})
export class UpdatePublicHolidayComponent implements OnInit {
  contries$: Observable<Country[]>;
  holidays: Holiday[];
  formConfig: FormGroup;
  updating: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) private scheduleOrg: ScheduleUW,
    private dialogRef: MatDialogRef<UpdatePublicHolidayComponent>,
    private fb: FormBuilder,
    private holidayService: HolidayService,
    private scheduleService: ScheduleService,
    private countryQuery: CountryQuery,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    this.contries$ = combineLatest([
      this.countryQuery.countries$,
      this.holidayService.getSupportedHolidayContries()
    ]).pipe(
      map(([countries, phCountries]) => {
        return countries.filter(c => phCountries.includes(c.code));
      })
    );

    this.formConfig = this.fb.group({
      phCountryCode: [this.scheduleOrg.phCountryCode]
    });

    this.formConfig
      .get('phCountryCode')
      .valueChanges.pipe(startWith(this.scheduleOrg.phCountryCode))
      .subscribe(key => {
        if (key) {
          this.holidayService.fetchHolidays(key, new Date().getFullYear()).subscribe(holidays => {
            this.holidays = holidays;
          });
        } else {
          this.holidays.length = 0;
        }
      });
  }

  update() {
    if (this.formConfig.valid) {
      this.updating = true;
      this.scheduleService
        .updateScheduleOrg(this.formConfig.value)
        .pipe(finalize(() => (this.updating = false)))
        .subscribe(
          _ => {
            this.toastr.success('Config default public holiday has been updated');
            this.dialogRef.close(this.formConfig.value);
          },
          err => this.toastr.error(err.message)
        );
    }
  }
}
