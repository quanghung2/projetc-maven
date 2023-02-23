import { DEFAULT_ORG_ICON, DISTRIBUTION_DOMAINS, isDistributionOrAdminPortal, TESTING_DOMAIN } from '@b3networks/shared/common';
import { Identity, MemberRole, UPPER_ADMIN_ROLES } from '../identity/identity';

export class ProfileOrg {
  orgUuid: string;
  orgName: string;
  orgShortName: string;
  logoUrl: string;
  role: MemberRole;
  walletUuid: string;
  walletCurrencyCode: string;
  isPartner: boolean;
  licenseEnabled: boolean;
  countryCode: string;
  domain: string;
  type: 'ADMIN' | 'DEMO' | 'CUSTOMER';
  timezone: string;
  timeFormat: string;
  created_datetime: number;

  constructor(profileOrg: Partial<ProfileOrg>) {
    if (profileOrg) {
      Object.assign(this, profileOrg);

      if (!profileOrg.isPartner && DISTRIBUTION_DOMAINS.indexOf(this.domain) > -1) {
        this.isPartner = true;
      }
    }
  }

  get photoSrc(): string {
    if (this.logoUrl) {
      return this.logoUrl;
    } else {
      return DEFAULT_ORG_ICON;
    }
  }

  get standardName(): string {
    if (this.orgName) {
      if (this.orgName.length > 16) {
        return this.orgName.substring(0, 15) + '...';
      } else {
        return this.orgName;
      }
    }
    return '';
  }

  /** SUPER_ADMIN follow OWNER role */
  get isOwner(): boolean {
    return this.role === MemberRole.OWNER || this.role === MemberRole.SUPER_ADMIN;
  }

  get isAdmin(): boolean {
    return this.role === MemberRole.ADMIN;
  }

  get isMember(): boolean {
    return this.role === MemberRole.MEMBER;
  }

  get isUpperAdmin(): boolean {
    return UPPER_ADMIN_ROLES.includes(this.role);
  }

  get isSuperAdmin(): boolean {
    return this.role === MemberRole.SUPER_ADMIN;
  }

  get utcOffset(): string {
    return this.timezone ? this.timezone.substring(3, 8) : '+0800';
  }

  get isTestingDomain() {
    return this.domain === atob(TESTING_DOMAIN);
  }
}

export class IdentityProfile extends Identity {
  organizations: ProfileOrg[]; // just get organization for specific portal (customer or admin)

  constructor(profile?: any) {
    super(profile);
    if (profile) {
      Object.assign(this, profile);
      if (profile.organizations) {
        this.organizations = profile.organizations.map(org => new ProfileOrg(org));
      } else {
        this.organizations = [];
      }
    }
  }

  get normalOrganizations() {
    return this.organizations.filter(org => !org.isPartner);
  }

  get adminOrganizations() {
    return this.organizations.filter(org => org.isPartner);
  }

  get isPartner() {
    return this.adminOrganizations.length > 0;
  }

  get shouldHaveAdminPortal() {
    return !isDistributionOrAdminPortal() && this.adminOrganizations.length > 0;
  }

  get standardName(): string {
    if (this.displayName) {
      if (this.displayName.length > 16) {
        return this.displayName.substring(0, 15) + '...';
      } else {
        return this.displayName;
      }
    }
    return '';
  }

  get photoSrc(): string {
    if (this.photoUrl) {
      return this.photoUrl;
    } else {
      return 'https://ui.b3networks.com/external/img/default_avatar.png';
    }
  }

  get shouldHasSwitchOrg() {
    return this.organizations.length > 1;
  }

  getOrganizationByUuid(uuid: string): ProfileOrg {
    const temp = this.organizations.filter((org: ProfileOrg) => {
      return org.orgUuid === uuid;
    });
    return temp.length > 0 ? temp[0] : null;
  }

  getOrganizationByUuidOrShortName(uuidOrName: string): ProfileOrg {
    const temp = this.organizations.filter((org: ProfileOrg) => {
      return org.orgUuid === uuidOrName || org.orgShortName === uuidOrName;
    });
    return temp.length > 0 ? temp[0] : null;
  }

  isExistOrg(uuid: string): boolean {
    return this.organizations.some((org: ProfileOrg) => org.orgUuid === uuid);
  }

  getFirstOrganization(): ProfileOrg {
    return this.organizations && this.organizations.length > 0 ? this.organizations[0] : null;
  }
}

export class UpdatePersonalRequest {
  constructor(
    public photoUrl: string,
    public givenName: string,
    public familyName: string,
    public displayName: string,
    public mobileNumber: string,
    public code: string,
    public token: string,
    public email: string,
    public password: string,
    public newPassword: string,
    public timezoneUuid: string,
    public number: string,
    public about: string
  ) {}
}

export class UpdatePersonalRequestBuilder {
  constructor() {}

  public createUpdatePersonalRequestForProfile(
    photoUrl: string,
    givenName: string,
    familyName: string,
    displayName: string,
    timezoneUuid: string,
    email?: string
  ) {
    return new UpdatePersonalRequest(
      photoUrl,
      givenName,
      familyName,
      displayName,
      null,
      null,
      null,
      email,
      null,
      null,
      timezoneUuid,
      null,
      null
    );
  }

  public createUpdatePersonalRequestForEmail(email: string) {
    return new UpdatePersonalRequest(null, null, null, null, null, null, null, email, null, null, null, null, null);
  }
  public createUpdatePersonalRequestForPassword(password: string, newPassword: string) {
    return new UpdatePersonalRequest(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      password,
      newPassword,
      null,
      null,
      null
    );
  }
}

export class NumberVerificationToken {
  token: string;
  sanitizedCode: string;
}

export class EmailVerificationToken {
  email: string;
  token: string;
}

export class UpdatePersonalResponse {
  numberVerificationToken: NumberVerificationToken;
  emailVerificationToken: EmailVerificationToken;
}
