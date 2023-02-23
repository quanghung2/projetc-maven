import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { map } from 'rxjs/operators';
import { LicenseFeatureCode } from '../constant';
import { Feature } from './feature.model';
import { FeatureStore } from './feature.store';

const EXTERNAL_ADDON_LICENSE_STARTWITH = 'externalapp_';

@Injectable({ providedIn: 'root' })
export class FeatureQuery extends Query<Feature> {
  selectAllFeatures$ = this.select('licenses');

  selectExternalAppIDs$ = this.select('licenses').pipe(
    map(list =>
      list
        ?.filter(l => l.startsWith(EXTERNAL_ADDON_LICENSE_STARTWITH))
        .map(l => l.substring(EXTERNAL_ADDON_LICENSE_STARTWITH.length))
    )
  );

  hasPhoneSystemBaseLicense$ = this.select('licenses').pipe(
    map(licenses => licenses?.some(x => x === LicenseFeatureCode.extension))
  );

  hasDeveloperLicense$ = this.select('licenses').pipe(
    map(licenses => licenses?.some(x => x === LicenseFeatureCode.developer))
  );

  hasContactCenterLicense$ = this.select('licenses').pipe(
    map(
      licenses =>
        licenses?.some(x => x === LicenseFeatureCode.license_center_supervisor) ||
        licenses?.some(x => x === LicenseFeatureCode.license_center_agent) ||
        licenses?.some(x => x === LicenseFeatureCode.license_call_center_enabled)
    )
  );

  get hasPhoneSystemBaseLicense() {
    return this.getValue()?.licenses?.some(x => x === LicenseFeatureCode.extension);
  }

  get hasCampaignLicense() {
    return this.getValue()?.licenses?.some(x => x === LicenseFeatureCode.license_campaign);
  }

  get hasDeveloperLicense() {
    return this.getValue()?.licenses?.some(x => x === LicenseFeatureCode.developer);
  }

  get hasCallCenterSupervisorLicense() {
    return this.getValue()?.licenses?.some(x => x === LicenseFeatureCode.license_center_supervisor);
  }

  get hasCallCenterEnabledLicense() {
    return this.getValue()?.licenses?.some(x => x === LicenseFeatureCode.license_call_center_enabled);
  }

  get hasCallCenterAgentLicense() {
    return this.getValue()?.licenses?.some(x => x === LicenseFeatureCode.license_center_agent);
  }

  get hasSIPLicense() {
    return this.getValue()?.licenses?.some(x => x === LicenseFeatureCode.license_sip);
  }

  get hasBYOCTrunkLicense() {
    return this.getValue()?.licenses?.some(x => x === LicenseFeatureCode.license_sip);
  }

  get hasContactCenterLicense() {
    return this.hasCallCenterSupervisorLicense || this.hasCallCenterAgentLicense || this.hasCallCenterEnabledLicense;
  }

  get hasAutoAttendantLicense() {
    return this.getValue()?.licenses?.some(x => x === LicenseFeatureCode.auto_attendant);
  }

  constructor(protected override store: FeatureStore) {
    super(store);
  }
}
