import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Country, CountryQuery, CountryService, IdentityProfileQuery } from '@b3networks/api/auth';
import {
  CountryOutboundRule,
  CountryWhiteListAction,
  OutboundRule,
  OutboundRuleService,
  UpdateCountryAction
} from '@b3networks/api/callcenter';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { StoreCountryWhiteListComponent } from '../store-country-white-list/store-country-white-list.component';

export interface InputStoreCountriesWhiteList {
  action: UpdateCountryAction;
  ruleId: number;
  allowedCountries?: CountryOutboundRule[];
  blockedCountries?: CountryOutboundRule[];
  country?: CountryOutboundRule;
}

@Component({
  selector: 'pos-countries-whitelist',
  templateUrl: './countries-whitelist.component.html',
  styleUrls: ['./countries-whitelist.component.scss']
})
export class CountriesWhitelistComponent implements OnInit, OnChanges {
  @ViewChild('countryWhiteListPaginator') countryWhiteListPaginator: MatPaginator;
  @Input() rule: OutboundRule;
  @Output() changed = new EventEmitter<boolean>();

  readonly UpdateCountryAction = UpdateCountryAction;
  readonly countryWhiteListDisplayedColumns = ['country', 'code', 'areaCode', 'passcode', 'actions'];

  countriesDataSource = new MatTableDataSource<CountryOutboundRule>();
  allCountries: CountryOutboundRule[] = [];
  allowedCountries: CountryOutboundRule[] = [];
  isAdmin: boolean;
  countries: Country[] = [];
  loading = true;
  afterInit = false;

  constructor(
    private outboundRuleService: OutboundRuleService,
    private profileQuery: IdentityProfileQuery,
    private dialog: MatDialog,
    private toastService: ToastService,
    private countryService: CountryService,
    private countryQuery: CountryQuery
  ) {}

  async ngOnInit(): Promise<void> {
    this.isAdmin = this.profileQuery.currentOrg.isUpperAdmin;
    this.countries = this.countryQuery.getHasCache()
      ? this.countryQuery.getAll()
      : await this.countryService.getCountry().toPromise();
    this.loading = false;
    this.initData();
    this.afterInit = true;
  }

  ngOnChanges() {
    if (this.afterInit) {
      this.initData();
    }
  }

  initData() {
    this.allCountries = this.countries.map(
      country =>
        new CountryOutboundRule({
          code: country.prefix.replace(/[-]/g, ''),
          name: country.name,
          ISO2: country.code
        })
    );

    this.allowedCountries = this.allCountries
      .reduce((prev, curr) => {
        const allowedCountries = this.rule.countryWhiteListV2.filter(c => c.getCountryCode() === curr.ISO2);

        allowedCountries.forEach(allowedCountry => {
          if (allowedCountry) {
            const map = { ...curr };

            map.passcode = allowedCountry.action === CountryWhiteListAction.ASK_PASSCODE;

            if (allowedCountry.getAreaCode()) {
              map.areaCode = allowedCountry.getAreaCode();
              map.areaLabel = allowedCountry.label;
            }

            prev.push(new CountryOutboundRule(map));
          }
        });

        return prev;
      }, [])
      .sort((a, b) => a.name.localeCompare(b.name));

    this.countriesDataSource = new MatTableDataSource(this.allowedCountries);

    setTimeout(() => {
      this.countryWhiteListPaginator.pageSize = 5;
      this.countriesDataSource.paginator = this.countryWhiteListPaginator;
    });
  }

  applyFilter(event: KeyboardEvent) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.countriesDataSource.filter = filterValue.trim().toLowerCase();
  }

  storeCountryWhiteList(action: UpdateCountryAction, country?: CountryOutboundRule) {
    if ([UpdateCountryAction.ADD, UpdateCountryAction.EDIT].includes(action)) {
      const data =
        action === UpdateCountryAction.ADD
          ? {
              action: action,
              ruleId: this.rule.id,
              allowedCountries: this.allowedCountries,
              allCountries: this.allCountries
            }
          : {
              action: action,
              ruleId: this.rule.id,
              country: country,
              allowedCountries: this.allowedCountries
            };

      this.dialog
        .open(StoreCountryWhiteListComponent, {
          disableClose: true,
          width: '400px',
          data: <InputStoreCountriesWhiteList>data
        })
        .afterClosed()
        .subscribe(res => {
          if (res && res['stored']) {
            this.changed.emit(true);
          }
        });
    } else {
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '450px',
          data: <ConfirmDialogInput>{
            title: 'Remove countries whitelist',
            message: 'This action will remove all countries from whitelist. Are you sure to remove?',
            color: 'warn'
          }
        })
        .afterClosed()
        .subscribe(confirmed => {
          if (confirmed) {
            this.outboundRuleService.updateOutboundRule(this.rule.id, { countryWhiteListV2: [] }).subscribe(
              _ => {
                this.toastService.success('Removed successfully');
                this.changed.emit(true);
              },
              err => {
                this.toastService.error(err.message);
              }
            );
          }
        });
    }
  }

  removeCountryFromWhiteList(country: CountryOutboundRule) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: <ConfirmDialogInput>{
          color: 'warn',
          title: 'Remove country',
          message: `Are you sure to remove ${country.getLocationWithCode()} from whitelist?`
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.outboundRuleService
            .updateOutboundRule(this.rule.id, {
              countryWhiteListV2: this.rule.countryWhiteListV2.filter(c => c.code !== country.getLocationCode())
            })
            .subscribe(
              _ => {
                this.toastService.success('Removed successfully');
                this.changed.emit(true);
              },
              error => {
                this.toastService.error(error.message);
              }
            );
        }
      });
  }

  togglePassCode(iso2: string, areaCode: string) {
    const countries = this.rule.countryWhiteListV2.filter(c => c.getCountryCode() === iso2);

    if (!countries.length) {
      return;
    }

    const country = areaCode ? countries.find(c => c.getAreaCode() === areaCode) : countries[0];

    if (!country) {
      return;
    }

    country.action =
      country.action === CountryWhiteListAction.ASK_PASSCODE
        ? CountryWhiteListAction.BYPASS
        : CountryWhiteListAction.ASK_PASSCODE;

    this.outboundRuleService.updateOutboundRule(this.rule.id, this.rule).subscribe(
      _ => {
        this.toastService.success('Updated successfully');
      },
      err => {
        this.toastService.error(err.message);
      }
    );
  }
}
