import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import {
  CountryOutboundRule,
  DialPlanDetail,
  DialPlanV3,
  MasterDialPlan,
  OutboundRule,
  OutboundRuleService
} from '@b3networks/api/callcenter';
import { X } from '@b3networks/shared/common';
import * as lodash from 'lodash';
import { finalize, tap } from 'rxjs/operators';
import { PortalConfigService } from '../../../portal-config.service';
import { getCountries } from '../../../shared/shared-functions';

declare const $;

@Component({
  selector: 'b3n-import-dial-plans',
  templateUrl: './import-dial-plans.component.html',
  styleUrls: ['./import-dial-plans.component.scss']
})
export class ImportDialPlansComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() rule: OutboundRule;

  modalEl: any;
  countriesDropdownEl: any;
  selectedCountryId: string;
  dialPlans: MasterDialPlan[] = [];

  loading = true;
  checkAll = false;
  masterDialPlanMapping = {};
  defaultCountryIds = [];
  countries = [];

  constructor(
    private el: ElementRef,
    private portalConfigService: PortalConfigService,
    private outboundRuleService: OutboundRuleService
  ) {}

  refresh() {
    $(window).trigger('resize');
    this.modalEl.modal('refresh');
  }

  ngOnDestroy() {
    this.modalEl.remove();
    this.countriesDropdownEl.remove();
  }

  ngOnInit(): void {
    this.outboundRuleService
      .getDialPlansDefault()
      .pipe(
        tap(plans => {
          this.masterDialPlanMapping = lodash.groupBy(plans, (item: MasterDialPlan) => item.countryCode);
          this.defaultCountryIds = Object.assign([], this.getCountryIds());
          this.countries = getCountries();
          this.countries = lodash.filter(this.countries, (country: CountryOutboundRule) =>
            this.defaultCountryIds.includes(country.id)
          );
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe();
  }

  getCountryIds(): string[] {
    return lodash.keys(this.masterDialPlanMapping);
  }

  getRulesByCountryId(countryID: string): MasterDialPlan[] {
    return Object.assign([], this.masterDialPlanMapping[countryID]);
  }

  ngAfterViewInit() {
    this.modalEl = $(this.el.nativeElement).find('div.modal');
    this.modalEl.modal({
      autofocus: false,
      allowMultiple: true,
      closable: false,
      onDeny: () => {
        this.portalConfigService.isChildModalOpen$.next(false);
      }
    });

    this.countriesDropdownEl = this.modalEl.find('.dropdown');
    this.countriesDropdownEl.dropdown({
      onChange: (id: string, _: never, __: never) => {
        this.selectedCountryId = id;
        this.dialPlans = this.getRulesByCountryId(this.selectedCountryId);
        this.dialPlans.forEach(d => (d.isChecked = false));
        this.checkAll = false;
        this.refresh();
      }
    });
  }

  showModal() {
    this.portalConfigService.isChildModalOpen$.next(true);
    this.countriesDropdownEl.dropdown('clear');
    this.checkAll = false;
    this.modalEl.modal('show');
  }

  check(dialPlan?: MasterDialPlan) {
    if (!dialPlan) {
      const existChecked = this.dialPlans.filter(d => d.isChecked).length;

      this.dialPlans.forEach(d => {
        d.isChecked = existChecked > 0 ? (existChecked === this.dialPlans.length ? false : true) : true;
      });

      return;
    }

    dialPlan.isChecked = !dialPlan.isChecked;

    const existChecked = this.dialPlans.filter(d => d.isChecked).length;

    this.checkAll = existChecked > 0 ? (existChecked === this.dialPlans.length ? true : false) : false;
  }

  save() {
    this.loading = true;

    const plans: DialPlanV3[] = this.dialPlans
      .filter(plan => plan.isChecked && plan.countryCode === this.selectedCountryId)
      .map(plan => {
        const dialPlan = new DialPlanV3();
        dialPlan.planDetail = Object.assign(new DialPlanDetail(), plan.planDetail);
        dialPlan.isEditing = true;
        dialPlan.outGoingCallRuleId = this.rule.id;
        return dialPlan;
      });

    plans.forEach(plan => {
      this.import(plan);
    });
  }

  import(dialPlan: DialPlanV3) {
    if (!this.validateDialPlan(dialPlan)) {
      return;
    }

    dialPlan.planDetail.startWith = dialPlan.planDetail.startWith
      ? dialPlan.planDetail.startWith.toString().split(',')
      : new Array<string>();

    dialPlan.planDetail.numberLength = dialPlan.planDetail.numberLength
      ? dialPlan.planDetail.numberLength.toString().split(',')
      : new Array<string>();

    dialPlan.planDetail.sipGatewayEndpoint = dialPlan.planDetail.sipGatewayEndpoint
      ? dialPlan.planDetail.sipGatewayEndpoint
      : '';

    this.outboundRuleService
      .importDialPlan(dialPlan)
      .subscribe(
        _ => {
          this.portalConfigService.isChildModalOpen$.next(false);
          this.portalConfigService.isStoreDialPlansSuccess$.next(true);
          this.modalEl.modal('hide');
          X.showSuccess('Import successfully');
        },
        error => {
          X.showWarn(error.message);
        }
      )
      .add(() => (this.loading = false));
  }

  validateDialPlan(dialPlan: DialPlanV3): boolean {
    let isValid = true;

    if (!dialPlan.planDetail.startWith && !dialPlan.planDetail.numberLength) {
      X.showWarn('Invalid matching condition');
      isValid = false;
    }

    return isValid;
  }

  get noPlanChecked() {
    return !this.dialPlans?.filter(d => d.isChecked).length;
  }
}
