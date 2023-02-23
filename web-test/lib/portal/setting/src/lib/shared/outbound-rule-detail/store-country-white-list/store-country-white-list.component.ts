import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import {
  CountryOutboundRule,
  CountryWhiteListAction,
  CountryWhiteListV2,
  OutboundRuleService,
  UpdateCountryAction
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, startWith, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'pos-update-country-white-list',
  templateUrl: './store-country-white-list.component.html',
  styleUrls: ['./store-country-white-list.component.scss']
})
export class StoreCountryWhiteListComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('select') select: MatSelect;
  countries: CountryOutboundRule[] = [];
  selectedCountries: CountryOutboundRule[] = [];
  action: UpdateCountryAction;
  indeterminate: boolean;
  storing: boolean;
  removing: boolean;
  form: UntypedFormGroup;
  country: CountryOutboundRule;

  readonly CountryWhiteListAction = CountryWhiteListAction;

  toggleSelectAll() {
    this.countriesFC.setValue(this.countriesFC.value.length !== this.countries.length ? this.countries : []);
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    private outboundRuleService: OutboundRuleService,
    private dialogRef: MatDialogRef<StoreCountryWhiteListComponent>,
    private toastService: ToastService,
    private fb: UntypedFormBuilder
  ) {
    super();
    this.action = data['action'];

    if (this.action === UpdateCountryAction.EDIT) {
      this.country = data['country'];
      this.countries = [this.country];
    } else {
      this.countries = this.action === UpdateCountryAction.ADD ? data['allCountries'] : data['allowedCountries'];
    }

    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      countries: [this.country ? [this.country] : [], [Validators.required]],
      passcode: [this.country?.passcode ?? false],
      countryArea: [this.country ? (this.country.areaCode ? true : false) : false],
      areaCode: [''],
      areaLabel: ['']
    });

    const { countries, countryArea, areaCode, areaLabel } = this.form.controls;

    if (!this.country) {
      countries.valueChanges
        .pipe(
          takeUntil(this.destroySubscriber$),
          tap(cs => {
            if (cs.length > 1) {
              countryArea.reset();
              areaCode.reset();
              areaLabel.reset();
            }
          })
        )
        .subscribe();
    } else {
      countries.disable();
    }

    countryArea.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        startWith(countryArea.value),
        tap(cArea => {
          areaCode.reset();
          areaLabel.reset();

          if (cArea) {
            areaCode.setValidators([Validators.required, Validators.pattern(/^[0-9]+$/)]);
            areaLabel.setValidators(Validators.required);
          } else {
            areaCode.clearValidators();
            areaLabel.clearValidators();
          }

          areaCode.updateValueAndValidity();
          areaLabel.updateValueAndValidity();
          this.form.updateValueAndValidity();
        })
      )
      .subscribe();

    if (this.country) {
      this.form.patchValue({
        areaCode: this.country.areaCode ?? '',
        areaLabel: this.country.areaLabel ?? ''
      });
    }
  }

  ngOnInit(): void {}

  storeCountryWhiteList() {
    if (!this.form.valid) return;

    this.storing = true;

    const ruleId = this.data['ruleId'];
    const currCountryWhiteListV2 = (this.data['allowedCountries'] as CountryOutboundRule[]).map(country => {
      const countryWLV2 = new CountryWhiteListV2({ label: country.areaLabel ?? '' });

      countryWLV2.updateAction(country.passcode);
      countryWLV2.updateCode(country.ISO2, country.areaCode);

      return countryWLV2;
    });

    const newCountryWhiteListV2 = (this.countriesFC.value as CountryOutboundRule[]).map(country => {
      const countryWLV2 = new CountryWhiteListV2({
        label: this.areaCode.value ? this.areaLabel.value?.trim() : ''
      });

      countryWLV2.updateAction(this.passcode.value);
      countryWLV2.updateCode(country.ISO2, this.areaCode.value);

      return countryWLV2;
    });

    let countryWhiteListV2: CountryWhiteListV2[];

    const checkExistedCountry = (code: string, country: CountryOutboundRule) => {
      const existCountry = currCountryWhiteListV2.find(c => c.code === code);
      const areaCode = this.areaCode.value ?? '';

      if (existCountry?.getAreaCode() === areaCode) {
        const warning = areaCode ? country.name + ' - ' + areaCode : country.name;
        this.toastService.warning(`${warning} is existed`);
        this.storing = false;
        return false;
      }

      return true;
    };

    if (this.country) {
      if (this.country.areaCode === newCountryWhiteListV2[0].getAreaCode()) {
        const filteredCountryWhiteListV2 = currCountryWhiteListV2.filter(c => c.code !== newCountryWhiteListV2[0].code);
        countryWhiteListV2 = [...filteredCountryWhiteListV2, ...newCountryWhiteListV2];
      } else {
        if (!checkExistedCountry(newCountryWhiteListV2[0].code, (this.countriesFC.value as CountryOutboundRule[])[0])) {
          return;
        }

        const filteredCountryWhiteListV2 = currCountryWhiteListV2.filter(
          c => c.code !== this.country.getLocationCode()
        );
        countryWhiteListV2 = [...filteredCountryWhiteListV2, ...newCountryWhiteListV2];
      }
    } else {
      const existCountries = currCountryWhiteListV2.filter(country => {
        return newCountryWhiteListV2.some(c => c.getCountryCode() === country.getCountryCode());
      });

      for (let i = 0; i < existCountries.length; i++) {
        if (
          !checkExistedCountry(
            existCountries[i].code,
            this.countries.find(c => c.ISO2 === existCountries[i].getCountryCode())
          )
        ) {
          return;
        }
      }

      countryWhiteListV2 = [...currCountryWhiteListV2, ...newCountryWhiteListV2];
    }

    this.outboundRuleService
      .updateOutboundRule(ruleId, {
        countryWhiteListV2: countryWhiteListV2
      })
      .pipe(finalize(() => (this.storing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close({ stored: true });
          this.toastService.success(`${this.action === 'ADD' ? 'Added' : 'Updated'} successfully`);
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  get countriesFC() {
    return this.form.controls['countries'] as UntypedFormControl;
  }

  get passcode() {
    return this.form.controls['passcode'] as UntypedFormControl;
  }

  get countryArea() {
    return this.form.controls['countryArea'] as UntypedFormControl;
  }

  get areaCode() {
    return this.form.controls['areaCode'] as UntypedFormControl;
  }

  get areaLabel() {
    return this.form.controls['areaLabel'] as UntypedFormControl;
  }

  get state() {
    if (this.countriesFC.value?.length > 0) {
      return this.countriesFC.value?.length !== this.countries.length ? 'indeterminate' : 'checked';
    }

    return 'unchecked';
  }
}
