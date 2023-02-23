export interface ApplicationService {
  alias: string;
  code: string;
}

export class Application {
  appId: string;
  name: string;
  path: string;
  portalType: string;
  redirectUrl: string;
  iconUrl: string;
  installationStatus: 'installed' | 'not_installed';
  services: ApplicationService[];
  isExternalApp: boolean;

  constructor(obj?: Partial<Application>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get portalAppPath() {
    return this.name.split(' ').join('');
  }

  get isInstalled() {
    return this.installationStatus === 'installed';
  }

  get sourceLocation() {
    return !!this.path ? this.path : this.redirectUrl;
  }
}

export class FetchPortalAppResp {
  list: Application[];
  total: number;
}
