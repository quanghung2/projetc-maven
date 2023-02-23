import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { filter, map } from 'rxjs/operators';
import { LicenseFeatureCode } from '../constant';
import { Me } from './me.model';
import { MeStore } from './me.store';

@Injectable({ providedIn: 'root' })
export class MeQuery extends Query<Me> {
  features$ = this.select('features');

  hasPhoneSystemLicense$ = this.select('features').pipe(
    filter(features => !!features), // had call api , init = null
    map(licenses => licenses?.some(x => x === LicenseFeatureCode.extension))
  );

  hasTeamChatLicense$ = this.select('features').pipe(
    filter(features => !!features), // had call api , init = null
    map(licenses => licenses?.some(x => x === LicenseFeatureCode.team_chat))
  );

  hasDeviceWebRTCLicense$ = this.select('features').pipe(
    filter(features => !!features), // had call api , init = null
    map(licenses => licenses?.some(x => x === LicenseFeatureCode.browser_device))
  );

  notMicrosoftTeamLicense$ = this.select('features').pipe(
    filter(features => !!features), // had call api , init = null
    map(licenses => !licenses?.some(x => x === LicenseFeatureCode.microsoft_team))
  );

  hasCallCenterSupervisorLicense$ = this.select('features').pipe(
    filter(features => !!features), // had call api , init = null
    map(licenses => licenses?.some(x => x === LicenseFeatureCode.license_center_supervisor))
  );

  hasCallCenterEnabledLicense$ = this.select('features').pipe(
    filter(features => !!features), // had call api , init = null
    map(licenses => licenses?.some(x => x === LicenseFeatureCode.license_call_center_enabled))
  );

  hasContactCenterLicense$ = this.select('features').pipe(
    filter(features => !!features), // had call api , init = null
    map(licenses =>
      (licenses as LicenseFeatureCode[])?.some(x =>
        [
          LicenseFeatureCode.license_center_supervisor,
          LicenseFeatureCode.license_call_center_enabled,
          LicenseFeatureCode.license_center_agent
        ].includes(x)
      )
    )
  );

  constructor(protected override store: MeStore) {
    super(store);
  }

  get hasPhoneSystemLicense() {
    return this.getValue()?.features?.some(x => x === LicenseFeatureCode.extension);
  }

  get hasTeamChat() {
    return this.getValue()?.features?.some(x => x === LicenseFeatureCode.team_chat);
  }

  get hasCallCenterSupervisorLicense() {
    return this.getValue()?.features?.some(x => x === LicenseFeatureCode.license_center_supervisor);
  }

  get hasCallCenterEnabledLicense() {
    return this.getValue()?.features?.some(x => x === LicenseFeatureCode.license_call_center_enabled);
  }

  get hasCallCenterAgentLicense() {
    return this.getValue()?.features?.some(x => x === LicenseFeatureCode.license_center_agent);
  }

  get hasDPOLicense() {
    return this.getValue()?.features?.some(x => x === LicenseFeatureCode.license_dpo);
  }

  get hasBulkFilteringLicense() {
    return this.getValue()?.features?.some(x => x === LicenseFeatureCode.license_bulk_filter);
  }

  get hasContactCenterLicense() {
    return this.hasCallCenterSupervisorLicense || this.hasCallCenterAgentLicense || this.hasCallCenterEnabledLicense;
  }

  get hasLiveChatLicense() {
    return this.getValue()?.features?.some(x => x === LicenseFeatureCode.license_livechat);
  }
}
