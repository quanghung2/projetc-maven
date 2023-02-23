import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import {
  CountryOutboundRule,
  CountryWhiteListAction,
  OutboundRule,
  OutboundRuleService
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, takeUntil, tap } from 'rxjs/operators';
import { ConfirmModalComponent } from '../../../common/confirm-modal/confirm-modal.component';
import { PAGIN, PortalConfigService } from '../../portal-config.service';
import { getCountries } from '../../shared/shared-functions';
import { StoreCountriesWhitelistComponent } from '../../store/outbound/store-countries-whitelist/store-countries-whitelist.component';

const countries = getCountries();

@Component({
  selector: 'b3n-countries-whitelist',
  templateUrl: './countries-whitelist.component.html',
  styleUrls: ['./countries-whitelist.component.scss']
})
export class CountriesWhitelistComponent
  extends DestroySubscriberComponent
  implements OnInit, OnChanges, AfterViewInit {
  @Input() oRule: OutboundRule;

  @Output() setLoading = new EventEmitter<boolean>();
  @Output() refresh = new EventEmitter<any>();

  @ViewChild(StoreCountriesWhitelistComponent) storeCountriesWhitelistModal: StoreCountriesWhitelistComponent;
  @ViewChild(ConfirmModalComponent) confirmModal: ConfirmModalComponent;
  @ViewChild('search') search: ElementRef;

  isAdmin: boolean;

  allCountries: CountryOutboundRule[] = [];
  allowedCountries: CountryOutboundRule[] = [];
  allowedCountriesPagin: CountryOutboundRule[] = [];
  allowedCountriesFilter: CountryOutboundRule[] = [];
  pagin = { ...PAGIN };

  constructor(
    private identityProfileQuery: IdentityProfileQuery,
    private outboundRuleService: OutboundRuleService,
    private portalConfigService: PortalConfigService
  ) {
    super();
  }

  ngAfterViewInit() {
    fromEvent(this.search.nativeElement, 'input')
      .pipe(
        takeUntil(this.destroySubscriber$),
        debounceTime(300),
        tap((input: any) => {
          this.pagin = { ...PAGIN };

          const keyword = (input.target.value as string).trim().toLowerCase();
          const isName = isNaN(parseFloat(keyword));

          this.allowedCountriesFilter = this.allowedCountries.filter(c => {
            return isName ? c.name.trim().toLowerCase().includes(keyword) : c.code.includes(keyword);
          });
          this.allowedCountriesPagin = this.allowedCountriesFilter.slice(
            this.pagin.pageStart,
            this.pagin.pageStart + this.pagin.pageSize
          );

          this.refresh.emit();
        })
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.identityProfileQuery.profile$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(profile => !!profile),
        tap(_ => {
          this.isAdmin = this.identityProfileQuery.currentOrg.isUpperAdmin;
        })
      )
      .subscribe();
  }

  ngOnChanges() {
    this.allCountries = countries;
    this.pagin = { ...PAGIN };

    if (this.search?.nativeElement) {
      this.search.nativeElement.value = '';
    }

    this.allowedCountries = this.allCountries
      .reduce((prev, curr) => {
        const allowedCountries = this.oRule.countryWhiteListV2.filter(c => c.getCountryCode() === curr.id);

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

    this.allowedCountriesFilter = [...this.allowedCountries];
    this.allowedCountriesPagin = this.allowedCountriesFilter.slice(
      this.pagin.pageStart,
      this.pagin.pageStart + this.pagin.pageSize
    );

    this.refresh.emit();
  }

  openStoreCountriesWhitelistModal(country?: CountryOutboundRule) {
    this.storeCountriesWhitelistModal.showModal(country);
  }

  checkPasscode(country: CountryOutboundRule) {
    this.setLoading.emit(true);
    this.oRule.countryWhiteListV2.forEach(c => {
      if (c.code == this.getLocationCode(country)) {
        c.action = country.passcode ? CountryWhiteListAction.BYPASS : CountryWhiteListAction.ASK_PASSCODE;
      }
    });

    this.outboundRuleService
      .updateOutboundRule(this.oRule.id, this.oRule)
      .subscribe(
        _ => {
          X.showSuccess('Updated successfully');
        },
        err => {
          X.showWarn(err.message);
        }
      )
      .add(() => this.setLoading.emit(false));
  }

  removeCountry(country?: CountryOutboundRule) {
    this.portalConfigService.isChildModalOpen$.next(true);
    this.confirmModal
      .show({
        header: 'Confirm remove',
        message: country ? `Are you sure to remove ${country.name}?` : 'Are you sure to remove all countries?'
      })
      .subscribe(res => {
        if (!res) {
          return;
        }

        this.setLoading.emit(true);
        this.outboundRuleService
          .updateOutboundRule(this.oRule.id, {
            countryWhiteListV2: country
              ? this.oRule.countryWhiteListV2.filter(c => c.code !== this.getLocationCode(country))
              : []
          })
          .subscribe(
            _ => {
              X.showSuccess('Remove country successfully');
            },
            error => {
              X.showWarn(error.message);
            }
          )
          .add(() => {
            this.portalConfigService.isStoreCountryWhitelistSuccess$.next(true);
            this.setLoading.emit(false);
          });
      })
      .add(() => this.portalConfigService.isChildModalOpen$.next(false));
  }

  getLocationCode(country: CountryOutboundRule) {
    return country.areaCode ? `${country.id}.${country.areaCode}` : country.id;
  }

  page(pageIndex: number) {
    let { pageStart } = this.pagin;
    const { pageSize } = this.pagin;

    if (pageStart === pageIndex - 1) {
      return;
    }

    this.pagin.pageStart = pageStart = pageIndex - 1;
    this.allowedCountriesPagin =
      pageStart < 1
        ? this.allowedCountriesFilter.slice(0, pageSize)
        : this.allowedCountriesFilter.slice(pageStart * pageSize, pageStart * pageSize + pageSize);

    this.refresh.emit();
  }
}
