import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CountryCodes } from '../../constants/countries';

@Component({
  selector: 'shc-phone-number',
  templateUrl: './phone-number.component.html',
  styleUrls: ['./phone-number.component.scss']
})
export class PhoneNumberComponent implements OnInit {
  @Input() countryCode = 'SG';
  myControl = new UntypedFormControl();
  countries$?: Observable<any[]>;

  constructor() {
    // todo something
  }

  ngOnInit() {
    this.countries$ = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : value.E164)),
      map(name => (name ? this._filter(name) : CountryCodes.slice()))
    );

    if (this.countryCode) {
      const result = this._filter(this.countryCode);
      if (result && result.length) {
        this.myControl.setValue(result[0]);
      }
    }
  }

  displayFn(country: any): string {
    return country ? country.Flag : '';
  }

  private _filter(value: string): any[] {
    const filterValue = value.toString().toLowerCase();
    return CountryCodes.filter(
      country =>
        country.CountryName.toLowerCase().indexOf(filterValue) === 0 ||
        country.ISO2.toLowerCase().indexOf(filterValue) === 0 ||
        country.ISO3.toLowerCase().indexOf(filterValue) === 0 ||
        country.E164.toString().indexOf(filterValue) === 0
    );
  }
}
