import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Country, CountryQuery, CountryService } from '@b3networks/api/auth';
import {
  EntityStatus,
  InboundRule,
  InboundRuleService,
  OrgConfig,
  OrgConfigQuery,
  OrgConfigService,
  OutboundRule,
  OutboundRuleService,
  ScheduleService,
  ScheduleUW
} from '@b3networks/api/callcenter';
import { RemarksDialogComponent } from '@b3networks/comms/shared';

import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import {
  CallerIdPlanComponent,
  InboundRuleStore
} from '../../shared/inbound-rule-detail/caller-id-plan/caller-id-plan.component';
import {
  InputUpdateOutboundRule,
  OutboundRuleDetailComponent
} from '../../shared/outbound-rule-detail/outbound-rule-detail.component';
import { CallParkingConfigComponent } from './call-parking-config/call-parking-config.component';
import { UpdateAgentConfigurationComponent } from './update-agent-configuration/update-agent-configuration.component';
import {
  UpdateCustomHolidayComponent,
  UpdateCustomHolidayData
} from './update-custom-holiday/update-custom-holiday.component';
import { UpdatePickupPrefixComponent } from './update-pickup-prefix/update-pickup-prefix.component';
import { UpdatePublicHolidayComponent } from './update-public-holiday/update-public-holiday.component';

@Component({
  selector: 'b3n-system-settings',
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.scss']
})
export class SystemSettingsComponent extends DestroySubscriberComponent implements OnInit {
  pickupPrefix: string;
  orgConfig: OrgConfig;
  loading: boolean;
  scheduleOrg: ScheduleUW;
  countries: Country[];
  savingRule: boolean;

  hintMsg = '';
  dataSource: MatTableDataSource<OutboundRule | InboundRule>;
  defaultRules: Array<OutboundRule | InboundRule> = [];
  drDisplayedColumns = ['type', 'name', 'actions'];
  RULE_STATUS = EntityStatus;

  constructor(
    private dialog: MatDialog,
    private orgConfigQuery: OrgConfigQuery,
    private orgConfigService: OrgConfigService,
    private outboundRuleService: OutboundRuleService,
    private inboundRuleService: InboundRuleService,
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
    combineLatest([
      this.orgConfigQuery.orgConfig$,
      this.outboundRuleService.getDefaultOrgOutboundRule(),
      this.inboundRuleService.getDefaultOrgInboundRule(),
      this.scheduleService.getScheduleOrg(),
      this.countryQuery.countries$
    ])
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(([orgConfig, oRule, iRule, scheduleOrg, countries]) => {
          console.log(`data changed`);
          this.defaultRules = [];
          this.defaultRules.push(oRule, iRule);
          this.dataSource = new MatTableDataSource(this.defaultRules);
          this.orgConfig = orgConfig;
          this.pickupPrefix = orgConfig?.pickupPrefix?.substring(1);
          this.hintMsg = `For example: if you want to pick up the call of the user 105, press *${this.pickupPrefix} 105#`;
          this.scheduleOrg = scheduleOrg;
          this.countries = countries;
        }),
        tap(() => (this.loading = false))
      )
      .subscribe();

    this.countryService.getCountry().subscribe();
    this.orgConfigService.getConfig().subscribe();
  }

  updateAgentConfiguration() {
    this.dialog.open(UpdateAgentConfigurationComponent, {
      width: '350px',
      disableClose: true,
      data: this.orgConfig
    });
  }

  updatePickupPrefix() {
    this.dialog
      .open(UpdatePickupPrefixComponent, {
        width: '350px',
        disableClose: true,
        data: this.orgConfig
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.orgConfig.pickupPrefix = res;
          this.pickupPrefix = res.substring(1);
          this.hintMsg = `For example: if you want to pick up the call of the user 105, press *${this.pickupPrefix} 105#`;
        }
      });
  }

  openCallParkingConfig(): void {
    this.dialog.open(CallParkingConfigComponent, {
      width: '350px',
      disableClose: true,
      data: {
        orgConfig: this.orgConfig,
        transferParkingTime: this.transferParkingTime,
        getTime: this.getTime
      }
    });
  }

  transferParkingTime(parkingTime: number) {
    if (!parkingTime) {
      return '';
    }

    if (parkingTime < 60) {
      return `${parkingTime} second${parkingTime > 1 ? 's' : ''}`;
    } else if (parkingTime < 3600) {
      const time = this.getTime(parkingTime, 60);
      return `${time.prefix} ${time.time} minute${time.time > 1 ? 's' : ''}`;
    } else {
      const time = this.getTime(parkingTime, 3600);
      return `${time.prefix} ${time.time} hour${time.time > 1 ? 's' : ''}`;
    }
  }

  getTime(parkingTime: number, unit: number) {
    let prefix = '';
    let time = parkingTime / unit;

    if (time % 1 !== 0) {
      prefix = '~';
      time = Math.round(time);
    }

    return { prefix, time };
  }

  openOutboundRuleDetail(rule: OutboundRule) {
    this.dialog
      .open(OutboundRuleDetailComponent, {
        width: '800px',
        data: <InputUpdateOutboundRule>{
          outboundRule: rule
        }
      })
      .afterClosed()
      .subscribe(created => {
        if (created) {
          this.outboundRuleService.getDefaultOrgOutboundRule().subscribe();
        }
      });
  }

  openCallerIdPlan(rule: InboundRule) {
    this.dialog.open(CallerIdPlanComponent, {
      width: '800px',
      autoFocus: false,
      data: <InboundRuleStore>{
        inboundRule: new InboundRule(rule),
        isDefaultRule: false
      }
    });
  }

  editOutboundRule(rule: OutboundRule) {
    this.savingRule = true;
    this.outboundRuleService
      .updateOutboundRule(rule.id, {
        status: rule.status === this.RULE_STATUS.ACTIVE ? this.RULE_STATUS.INACTIVE : this.RULE_STATUS.ACTIVE
      })
      .subscribe(
        _ => {
          this.outboundRuleService.getDefaultOrgOutboundRule().subscribe(oRule => {
            const findIndex = this.defaultRules.findIndex(x => x.id === rule.id);
            if (findIndex > -1) {
              this.defaultRules[findIndex] = oRule;
              this.dataSource = new MatTableDataSource(this.defaultRules);
            }
          });
          this.toastService.success(
            `${rule.status === this.RULE_STATUS.ACTIVE ? 'Disable' : 'Enable'} outbound rule successfully`
          );
        },
        err => this.toastService.warning(err.message)
      )
      .add(() => (this.savingRule = false));
  }

  editInboundRule(rule: InboundRule) {
    this.savingRule = true;
    this.inboundRuleService
      .update(rule.id, {
        status: rule.status === this.RULE_STATUS.ACTIVE ? this.RULE_STATUS.INACTIVE : this.RULE_STATUS.ACTIVE
      })
      .subscribe(
        _ => {
          this.inboundRuleService.getDefaultOrgInboundRule().subscribe(iRule => {
            const findIndex = this.defaultRules.findIndex(x => x.id === rule.id);
            if (findIndex > -1) {
              this.defaultRules[findIndex] = iRule;
              this.dataSource = new MatTableDataSource(this.defaultRules);
            }
          });
          this.toastService.success(
            `${rule.status === this.RULE_STATUS.ACTIVE ? 'Disable' : 'Enable'} inbound rule successfully`
          );
        },
        err => this.toastService.warning(err.message)
      )
      .add(() => (this.savingRule = false));
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

  openRemarksDialog() {
    this.dialog.open(RemarksDialogComponent, {
      width: '500px',
      autoFocus: false
    });
  }
}
