import { Component, OnInit } from '@angular/core';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { DefaultTagService } from '@b3networks/api/billing';
import { ACTION, SmsJobService } from '@b3networks/api/sms';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { chain, intersection, isEqual } from 'lodash';
import { combineLatest, timer } from 'rxjs';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';
import { IAMAction } from '../core/models/iam-action.model';
import { Policy, PolicyDomain } from '../core/models/policy.model';
import { PortalConfig } from '../core/models/portal-config.model';
import { Resource } from '../core/models/resource.model';
import { SellerConfig } from '../core/models/seller-config.interface';
import { PartnerService, RouteService } from '../core/services';
import { IAMService } from '../core/services/iam.service';
import { SellerConfigService } from '../core/services/seller-config.service';

declare const X;
declare const $;

export interface CustomActionConfig {
  desc: string;
  groupedResources: Resource[];
  isAllowed?: boolean;
  name: string;
  render: boolean;
  selectedResources?: TagInput[];
}

export interface TagInput {
  key: string;
  value: string;
}

@Component({
  selector: 'app-portal-config',
  templateUrl: './portal-config.component.html',
  styleUrls: ['./portal-config.component.scss']
})
export class PortalConfigComponent extends DestroySubscriberComponent implements OnInit {
  isLoading = true;

  portalConfig: PortalConfig;
  sellerConfig: SellerConfig;
  customActionsConfig: CustomActionConfig[] = [];

  IAMActions: IAMAction[] = [];
  policies: Policy[];

  isOrganizationChecked = true;
  isReportsChecked = true;
  isDisabledShowSubscriptionMenu: boolean;
  defaultKeys: string[] = [];
  blacklistKeys: string[] = [];
  isEnabledBlacklist: boolean;
  domain: string;

  private latestPolicyVersion: string;
  private selectedResourceKeysByActionObj = {
    DisplaySidebarFeature: [''],
    EnableInterface: [''],
    ShowOrganizationMenu: [''],
    ShowPaymentOption: [''],
    ShowSubscriptionColumn: [''],
    ShowSubscriptionMenu: [''],
    ShowTerminationOption: ['']
  };

  constructor(
    private partnerService: PartnerService,
    private routeService: RouteService,
    private iamService: IAMService,
    private sellerService: SellerConfigService,
    private defaultTagService: DefaultTagService,
    private smsJobService: SmsJobService,
    private identityProfileQuery: IdentityProfileQuery
  ) {
    super();
  }

  ngOnInit() {
    combineLatest([this.iamService.getResources(), this.iamService.getPolicyDomain(), this.iamService.getActions()])
      .pipe(
        finalize(() => {
          timer(250).subscribe(() => {
            $('.ui.accordion').accordion();
            this.setOrgChecked();
            this.isLoading = false;
          });
        })
      )
      .subscribe(([resources, policyDomain, actions]) => {
        this.policies = policyDomain.policies;
        this.latestPolicyVersion = policyDomain.version;

        this.IAMActions = actions;

        this.customActionsConfig = chain(resources)
          .groupBy('action')
          .map((value, key) => ({
            name: key,
            desc: this.getCurrentActionName(key),
            render: this.isActionRendered(key),
            groupedResources: value
          }))
          .value();

        this.customActionsConfig.map(action =>
          action.groupedResources.map(
            resource => (resource.isAllowed = this.checkIsAllowed(action.name, [resource.name]))
          )
        );
        this.customActionsConfig.map(action => {
          action.selectedResources = action.groupedResources
            .filter(resource => resource.isAllowed)
            .map(resource => ({
              key: resource.name,
              value: resource.desc
            }));
        });

        this.customActionsConfig.forEach(action => {
          this.selectedResourceKeysByActionObj[action.name] = action.selectedResources.map(resource => resource.key);
        });
      });

    this.routeService.domain.pipe(switchMap(() => this.partnerService.getPortalConfig())).subscribe(
      res => {
        this.portalConfig = new PortalConfig(res);
        this.isReportsChecked =
          this.portalConfig.showUsageHistory || this.portalConfig.showAudit || this.portalConfig.showReport;
        this.isDisabledShowSubscriptionMenu = !this.portalConfig.showSubscription;
      },
      err => {
        X.showWarn('Could not load config!');
        console.log(err);
      }
    );

    this.sellerService.getSellerConfig().subscribe(sellerConfig => (this.sellerConfig = sellerConfig));
    this.defaultTagService.getDefaultTag().subscribe(res => {
      this.defaultKeys = res.defaultKeys;
    });
    this.smsJobService.getKeysBlacklist().subscribe(keys => (this.blacklistKeys = [...keys]));
    this.identityProfileQuery.profile$.pipe(takeUntil(this.destroySubscriber$)).subscribe(profile => {
      if (profile?.domain) {
        this.domain = profile.domain;
        this.smsJobService
          .getEnabledBlacklistKeys(profile.domain)
          .subscribe(({ whitelistKeywords }) => (this.isEnabledBlacklist = !isEqual(whitelistKeywords, ['*'])));
      }
    });
  }

  findActionByName(name: string): CustomActionConfig {
    return this.customActionsConfig.find(action => action.name === name);
  }

  onResourceAsCheckBoxChange(resourceName, actionName) {
    const index = this.selectedResourceKeysByActionObj[actionName].findIndex(resource => resource === resourceName);
    if (index >= 0) {
      this.selectedResourceKeysByActionObj[actionName].splice(index, 1);
    } else {
      this.selectedResourceKeysByActionObj[actionName].push(resourceName);
    }
  }

  updateTagInputConfig(selectedTagInputKeys: string[], groupKey: string) {
    this.selectedResourceKeysByActionObj[groupKey] = selectedTagInputKeys;
  }

  showOrgChange() {
    if (!this.isOrganizationChecked) {
      this.portalConfig.showMember = false;
      this.onShowMemberChange();
    }
  }

  onShowMemberChange() {
    if (!this.portalConfig.showMember) {
      this.portalConfig.allowMemberImport = false;
    }
  }

  onShowReportsChange() {
    if (!this.isReportsChecked) {
      this.portalConfig.showUsageHistory = false;
      this.portalConfig.showAudit = false;
      this.portalConfig.showReport = false;
    }
  }

  showPricingChange() {
    if (!this.portalConfig.showPricing) {
      this.portalConfig.allowTopup = false;
      this.portalConfig.showInvoice = false;
    }
  }

  save() {
    this.isLoading = true;
    this.updatePortalConfig();
    this.updatePolicies();
    this.updateSellerConfig();
    this.updateDefaultTag();
  }

  updateDefaultTag() {
    const body = {
      defaultKeys: this.defaultKeys
    };
    this.defaultTagService.createTag(body).subscribe();
  }

  onAddKeyBlackList() {
    this.smsJobService.updateKeysBlacklist(this.blacklistKeys, ACTION.ADD).subscribe();
  }

  onRemoveKeyBlackList(key) {
    this.smsJobService.updateKeysBlacklist([key], ACTION.REMOVE).subscribe();
  }

  onChangeEnableKeyBlacklist() {
    this.smsJobService.updateEnabledBlacklistKeys(this.domain, this.isEnabledBlacklist ? [] : ['*']).subscribe();
  }

  private updatePortalConfig() {
    this.partnerService
      .updatePortalConfig(this.portalConfig)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => {
          X.showSuccess('Saved successfully!');
        },
        err => {
          X.showWarn('Could not save changes!');
          console.log(err);
        }
      );
  }

  private updatePolicies() {
    const body: PolicyDomain = {
      version: this.latestPolicyVersion,
      policies: []
    };

    const actionServerResponse = this.policies.map(policy => policy.action);

    for (const actionName in this.selectedResourceKeysByActionObj) {
      if (this.selectedResourceKeysByActionObj.hasOwnProperty(actionName) && this.findActionByName(actionName)) {
        if (!actionServerResponse.includes(actionName) && !this.selectedResourceKeysByActionObj[actionName].length) {
          continue;
        }
        body.policies.push({
          service: 'ui',
          action: actionName,
          resources: this.selectedResourceKeysByActionObj[actionName]
        });
      }
    }

    // readd nonchange policy
    const addedPolicyActions = body.policies.map(p => p.action);
    this.policies.forEach(p => {
      if (!addedPolicyActions.includes(p.action)) {
        body.policies.push(p);
      }
    });

    this.iamService
      .updatePolicies(body)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        policyDomain => (this.latestPolicyVersion = policyDomain.version),
        err => {
          X.showWarn('Could not save changes!');
          console.log(err);
        }
      );
  }

  private updateSellerConfig() {
    this.sellerService.updateSellerConfig(this.sellerConfig).subscribe();
  }

  private getCurrentActionName(key: string): string {
    const current = this.IAMActions.find(action => action.name === key);
    return current ? current.desc : key;
  }

  private isActionRendered(key: string): boolean {
    const current = this.IAMActions.find(action => action.name === key);
    return current && current.scopes.toString().toLowerCase().includes('domain');
  }

  private checkIsAllowed(key: string, resources): any {
    const current = this.policies.find(policy => policy.action === key);
    return current && !!intersection(current.resources, resources).length;
  }

  private setOrgChecked() {
    if (this.portalConfig && this.IAMActions) {
      this.isOrganizationChecked = this.portalConfig.showMember;
      if (!this.isOrganizationChecked) {
        this.isOrganizationChecked = !!this.findActionByName('ShowOrganizationMenu').selectedResources.length;
      }
    }
  }
}
