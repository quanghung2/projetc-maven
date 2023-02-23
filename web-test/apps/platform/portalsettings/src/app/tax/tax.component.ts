import { CountryMapping, TaxVatConfigExtended } from './../core/models/tax-vat-config.model';
import { Country } from './../core/models/country.model';
import { finalize } from 'rxjs/operators';
import { TaxService } from './../core/services/tax.service';
import { AuthService } from './../core/services/private-http/auth.service';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MessageConstants } from '@b3networks/shared/common';

declare const X;
declare const $;

@Component({
  selector: 'app-tax',
  templateUrl: './tax.component.html',
  styleUrls: ['./tax.component.scss']
})
export class TaxComponent implements OnInit {
  isLoading = true;

  countries: Country[];
  pickableCountries: Country[];
  configs: TaxVatConfigExtended[];

  // Temporary old configs that will be used to restore last state when cancel edit mode
  isEditingConfigs: Map<string, TaxVatConfigExtended> = new Map();

  selectedTaxProfile: TaxVatConfigExtended;
  selectedCountriesMapping: Country[] = [];

  constructor(private authService: AuthService, private taxService: TaxService) {}

  ngOnInit() {
    forkJoin([this.authService.getCountries(), this.taxService.getAllVatConfigs()])
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(res => {
        this.countries = res[0];
        this.configs = res[1].map(c => new TaxVatConfigExtended(c));
        this.getMappingCountry();
        this.filterCountriesListWithExistingConfigs();
      });
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

  showModal(config?: TaxVatConfigExtended) {
    if (!config) {
      this.selectedTaxProfile = new TaxVatConfigExtended({}, true);
    } else {
      this.isEditingConfigs.set(config.countryCode, new TaxVatConfigExtended(config, false, config.mappingCountry));
      config.isEditing = true;
      this.selectedTaxProfile = config;
      this.selectedTaxProfile.mappingCountry.applicableCountries.forEach(countryCode => {
        this.selectedCountriesMapping.push(
          new Country({
            code: countryCode,
            key: countryCode,
            name: this.getCountryName(countryCode),
            value: this.getCountryName(countryCode)
          })
        );
      });
    }
    $('.countryMapping.modal')
      .modal({
        closable: false
      })
      .modal('show');
  }

  save() {
    if (this.selectedTaxProfile.isNew) {
      this.addTaxConfig(this.selectedTaxProfile)
    } else {
      this.updateVatConfig(this.selectedTaxProfile);
      this.updateMappingCountries();
    }
  }

  updateVatConfig(config: TaxVatConfigExtended) {
    this.taxService.updateVatConfig(config.countryCode, config.taxNumber, config.taxable).subscribe(
      () => {
        config.isEditing = false;
        this.isEditingConfigs.delete(config.countryCode);
        X.showSuccess('Changes saved successfully!');
      },
      err => {
        X.showWarn('Error occurred. Could not save changes!');
        console.log(err);
      }
    );
  }

  private updateMappingCountries() {
    const countryMapping: CountryMapping = {
      forAllNotSpecified: this.selectedTaxProfile.mappingCountry.forAllNotSpecified,
      applicableCountries: this.selectedCountriesMapping.map(item => item.code)
    };
    this.taxService
      .updateCountriesMapping(this.selectedTaxProfile.countryCode, countryMapping)
      .pipe(finalize(() => this.closeModal()))
      .subscribe(
        () => {
          this.getMappingCountry();
        },
        err => {
          X.showWarn(err && err.message ? err.message : MessageConstants.GENERAL_ERROR);
        }
      );
  }

  addTaxConfig(config: TaxVatConfigExtended) {
    this.taxService.addVatConfig(config.countryCode, config.taxNumber, config.taxable).subscribe(
      () => {
        this.configs.push(new TaxVatConfigExtended(config));
        // Re-filter countries list
        this.filterCountriesListWithExistingConfigs();
        this.updateMappingCountries();
        X.showSuccess('New config saved successfully!');
      },
      err => {
        X.showWarn('Error occurred. Could not save config!');
      }
    );
  }

  cancel() {
    const i = this.configs.findIndex(c => c.countryCode === this.selectedTaxProfile.countryCode);
    this.configs[i] = this.isEditingConfigs.get(this.selectedTaxProfile.countryCode);
    this.isEditingConfigs.delete(this.selectedTaxProfile.countryCode);
    this.closeModal();
  }

  closeModal() {
    this.selectedTaxProfile = null;
    this.selectedCountriesMapping = [];
    $('.countryMapping.modal').modal('hide');
  }

  private filterCountriesListWithExistingConfigs() {
    const countriesHasConfig: Set<string> = new Set(this.configs.map(c => c.countryCode));
    this.pickableCountries = this.countries.filter(c => !countriesHasConfig.has(c.code));
  }

  private getMappingCountry(): void {
    this.configs.forEach(config => {
      this.taxService.getCountriesMapping(config.countryCode).subscribe(mapping => (config.mappingCountry = mapping));
    });
  }

  removeTagInput(item) {
    const index = this.selectedCountriesMapping.findIndex(country => country.code === item.code);
    this.selectedCountriesMapping.splice(index, 1);
  }

  addTagInput(item) {
    this.selectedCountriesMapping.push(item);
  }
}
