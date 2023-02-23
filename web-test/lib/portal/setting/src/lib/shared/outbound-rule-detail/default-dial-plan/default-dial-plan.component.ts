import { Component, Inject, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  CountryOutboundRule,
  DialPlanDetail,
  DialPlanV3,
  MasterDialPlan,
  OutboundRuleService
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import * as _ from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { getCountries } from '../../shared-functions';

@Component({
  selector: 'pos-default-dial-plan',
  templateUrl: './default-dial-plan.component.html',
  styleUrls: ['./default-dial-plan.component.scss']
})
export class DefaultDialPlanComponent extends DestroySubscriberComponent implements OnInit {
  importing: boolean;
  masterDialPlanMapping = {};
  dialPlans: MasterDialPlan[] = [];
  defaultCountryIDs = [];
  countries = [];
  selectedCountryID: string;
  dialPlanDisplayedColumns = ['checkbox', 'startWith', 'numberLength', 'removePrefix', 'appendPrefix'];

  constructor(
    private outboundRuleService: OutboundRuleService,
    @Inject(MAT_DIALOG_DATA) public ruleId: number,
    private dialogRef: MatDialogRef<DefaultDialPlanComponent>,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.outboundRuleService
      .getDialPlansDefault()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(plans => {
        this.masterDialPlanMapping = _.groupBy(plans, (item: MasterDialPlan) => item.countryCode);
        this.defaultCountryIDs = Object.assign([], this.getCountryIDs());
        this.countries = getCountries();
        this.countries = _.filter(this.countries, (country: CountryOutboundRule) =>
          this.defaultCountryIDs.includes(country.ISO2)
        );
      });
  }

  getCountryIDs(): string[] {
    return _.keys(this.masterDialPlanMapping);
  }

  getRulesByCountryID(countryID: string): MasterDialPlan[] {
    return Object.assign([], this.masterDialPlanMapping[countryID]);
  }

  selectCountry() {
    this.dialPlans = this.getRulesByCountryID(this.selectedCountryID);
    console.log(this.dialPlans);
  }

  selectPlan(dialPlan: MasterDialPlan, event: MatCheckboxChange) {
    event.checked ? (dialPlan.isChecked = true) : (dialPlan.isChecked = false);
  }

  import() {
    this.importing = true;
    const plans = this.dialPlans
      .filter(plan => plan['isChecked'] && plan.countryCode === this.selectedCountryID)
      .map(fl => {
        const dialPlan = new DialPlanV3();
        dialPlan.planDetail = Object.assign(new DialPlanDetail(), fl.planDetail);
        dialPlan.isEditing = true;
        dialPlan.outGoingCallRuleId = this.ruleId;
        return dialPlan;
      });
    plans.forEach(plan => {
      this.saveDialPlan(plan);
    });
  }

  saveDialPlan(dialPlan: DialPlanV3) {
    if (this.validateDialPlan(dialPlan)) {
      dialPlan.planDetail.startWith = dialPlan.planDetail.startWith
        ? dialPlan.planDetail.startWith.toString().split(',')
        : new Array<string>();
      dialPlan.planDetail.numberLength = dialPlan.planDetail.numberLength
        ? dialPlan.planDetail.numberLength.toString().split(',')
        : new Array<string>();
      dialPlan.planDetail.sipGatewayEndpoint = dialPlan.planDetail.sipGatewayEndpoint
        ? dialPlan.planDetail.sipGatewayEndpoint
        : '';
      this.outboundRuleService.importDialPlan(dialPlan).subscribe(
        _ => {
          this.importing = false;
          this.dialogRef.close({ imported: true });
        },
        error => {
          this.importing = false;
          this.toastService.error(error.message);
        }
      );
    }
  }

  validateDialPlan(dialPlan: DialPlanV3): boolean {
    let isValid = true;
    if (!dialPlan.planDetail.startWith && !dialPlan.planDetail.numberLength) {
      this.toastService.error('Invalid matching condition');
      isValid = false;
    }
    return isValid;
  }

  toggleAll(event: MatCheckboxChange) {
    this.dialPlans = this.dialPlans.map(plan => {
      return { ...plan, isChecked: event.checked };
    });
  }

  get isIndeterminate() {
    const checkedPlan = this.dialPlans.filter(plan => plan.isChecked) || [];
    return checkedPlan.length < this.dialPlans.length && checkedPlan.length > 0;
  }

  get allPlanChecked() {
    const checkedPlan = this.dialPlans.filter(plan => plan.isChecked) || [];
    return checkedPlan.length === this.dialPlans.length;
  }

  get noPlanChecked() {
    return !this.isIndeterminate && !this.allPlanChecked;
  }
}
