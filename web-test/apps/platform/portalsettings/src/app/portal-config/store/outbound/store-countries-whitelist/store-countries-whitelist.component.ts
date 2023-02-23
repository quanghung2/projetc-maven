import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { CountryOutboundRule, CountryWhiteListV2, OutboundRule, OutboundRuleService } from '@b3networks/api/callcenter';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { finalize } from 'rxjs/operators';
import { PortalConfigService } from '../../../portal-config.service';

declare const $;

@Component({
  selector: 'b3n-store-countries-whitelist',
  templateUrl: './store-countries-whitelist.component.html',
  styleUrls: ['./store-countries-whitelist.component.scss']
})
export class StoreCountriesWhitelistComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() oRule: OutboundRule;
  @Input() allowedCountries: CountryOutboundRule[];
  @Input() allCountries: CountryOutboundRule[];

  selectAll = false;
  passcode = false;
  countryArea: boolean = false;
  areaCode: string;
  areaLabel: string;
  countriesStatus: HashMap<boolean> = {};
  country: CountryOutboundRule;

  saving: boolean;
  addable: boolean = false;
  modalEl: any;
  countriesDropdownEl: any;

  constructor(
    private el: ElementRef,
    private portalConfigService: PortalConfigService,
    private outboundRuleService: OutboundRuleService,
    private toastService: ToastService
  ) {}

  ngOnDestroy() {
    this.modalEl.remove();
    this.countriesDropdownEl.remove();
  }

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.modalEl = $(this.el.nativeElement).find('div.modal');
    this.modalEl.modal({
      closable: false,
      allowMultiple: true,
      autofocus: false,
      onDeny: () => {
        this.portalConfigService.isChildModalOpen$.next(false);
      }
    });

    this.countriesDropdownEl = this.modalEl.find('.dropdown');
    this.countriesDropdownEl.dropdown({
      onHide: () => {
        const countryCodes: string[] = Object.keys(this.countriesStatus)
          .filter(c => !!this.countriesStatus[c])
          .map(c => this.allCountries.find(b => b.id === c)?.name)
          .filter(c => !!c);

        this.addable = !!countryCodes.length;
        this.countriesDropdownEl.dropdown(
          'set text',
          countryCodes.length ? countryCodes.join(', ') : 'Select countries'
        );
      }
    });
  }

  showModal(country?: CountryOutboundRule) {
    this.portalConfigService.isChildModalOpen$.next(true);
    this.countriesDropdownEl.dropdown('clear');
    this.selectAll = false;
    this.passcode = country ? country.passcode : false;
    this.country = country;

    if (country) {
      this.addable = true;
      this.countryArea = country.areaCode ? true : false;
      this.areaCode = country.areaCode;
      this.areaLabel = country.areaLabel;
    }

    this.allCountries.forEach(c => {
      this.countriesStatus[c.id] = false;
    });
    this.modalEl.modal('show');
  }

  select(country?: CountryOutboundRule) {
    if (!country) {
      this.selectAll = !this.selectAll;

      const selected = Object.values(this.countriesStatus).filter(c => !!c).length;

      this.allCountries.forEach(c => {
        this.countriesStatus[c.id] = selected > 0 ? (selected === this.allCountries.length ? false : true) : true;
      });

      return;
    }

    this.countriesStatus[country.id] = !this.countriesStatus[country.id];

    const selected = Object.values(this.countriesStatus).filter(c => !!c).length;

    this.selectAll = selected > 0 ? (selected === this.allCountries.length ? true : false) : false;
  }

  save() {
    if (!this.addable || !this.isValidateCountryArea()) return;

    this.saving = true;

    const currCountryWhiteListV2 = (this.allowedCountries as CountryOutboundRule[]).map(country => {
      const countryWLV2 = new CountryWhiteListV2({
        label: country.areaLabel ?? ''
      });

      countryWLV2.updateAction(country.passcode);
      countryWLV2.updateCode(country.id, country.areaCode);

      return countryWLV2;
    });

    const countryIds: string[] = Object.keys(this.countriesStatus).filter(c => !!this.countriesStatus[c]);

    const newCountryWhiteListV2 = countryIds.map(country => {
      const countryWLV2 = new CountryWhiteListV2({
        label: this.areaCode ? this.areaLabel?.trim() : ''
      });

      countryWLV2.updateAction(this.passcode);
      countryWLV2.updateCode(country, this.areaCode);

      return countryWLV2;
    });

    if (this.country) {
      currCountryWhiteListV2.forEach(c => {
        if (c.code === this.getLocationCode(this.country)) {
          c.label = this.areaLabel?.trim();
          c.code = this.areaCode ? [c.getCountryCode(), this.areaCode].join('.') : c.getCountryCode();
        }
      });

      const listCode = currCountryWhiteListV2.map(c => c.code);
      const isExistCode = listCode.some((item, idx) => listCode.indexOf(item) !== idx);
      if (isExistCode) {
        this.toastService.warning(`${this.country.name} is existed`);
        this.saving = false;
        return;
      }
    } else {
      const existCountry = currCountryWhiteListV2.find(c =>
        newCountryWhiteListV2.some(({ code: code }) => c.code === code)
      );

      if (existCountry?.getAreaCode() === this.areaCode.toString()) {
        this.toastService.warning(`${this.getCountryName(existCountry.getCountryCode())} is existed`);
        this.saving = false;
        return;
      }
    }

    let countryWhiteListV2: CountryWhiteListV2[];
    countryWhiteListV2 = [...currCountryWhiteListV2, ...newCountryWhiteListV2];

    this.outboundRuleService
      .updateOutboundRule(this.oRule.id, { countryWhiteListV2: countryWhiteListV2 })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        _ => {
          this.portalConfigService.isStoreCountryWhitelistSuccess$.next(true);
          this.portalConfigService.isChildModalOpen$.next(false);
          this.modalEl.modal('hide');
          X.showSuccess('Updated successfully');
          this.addable = false;
          this.countryArea = false;
          this.allCountries.forEach(c => {
            this.countriesStatus[c.id] = false;
          });
        },
        err => {
          X.showWarn(err.message);
        }
      );
  }

  isValidateCountryArea() {
    if (this.countryArea) {
      return !(!this.areaLabel || !this.areaCode || !/^[0-9]+$/.test(this.areaCode));
    }
    this.areaLabel = '';
    this.areaCode = '';
    return true;
  }

  getCountryName(countryCode: string): string {
    if (!!this.allCountries) {
      const country: CountryOutboundRule = this.allCountries.find(c => c.id === countryCode);
      if (!!country) {
        return country.name;
      }
    }

    return '';
  }

  getLocationCode(country: CountryOutboundRule) {
    return country.areaCode ? `${country.id}.${country.areaCode}` : country.id;
  }
}
