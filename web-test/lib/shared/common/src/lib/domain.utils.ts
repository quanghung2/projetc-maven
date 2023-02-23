import { Inject, Injectable, Optional } from '@angular/core';
import { DEFAULT_API_PROXY, INJECT_PORTAL_DOMAIN, TESTING_DOMAIN, TESTING_UAT_DOMAINS } from './constants/constants';
import { isLocalhost } from './utils/plain_func.util';

@Injectable({ providedIn: 'root' })
export class DomainUtilsService {
  private _apiUrl = location.origin + '/_a';
  private _storageBackdoorAPIUrl = location.origin + '/_b';

  get apiUrl() {
    return this._apiUrl;
  }

  get portalDomain() {
    let domain = window.location.hostname;
    if (isLocalhost()) {
      domain = this._portalDomain || atob(TESTING_DOMAIN);
    }
    return domain;
  }

  get storageBackdoorAPIUrl() {
    return this._storageBackdoorAPIUrl;
  }

  get domainPortal() {
    let domain = window.location.hostname;
    if (isLocalhost()) {
      domain = this._portalDomain || atob(TESTING_DOMAIN);
    }
    return domain;
  }

  get isTestingDomain() {
    return this.domainPortal === atob(TESTING_DOMAIN);
  }

  constructor(@Optional() @Inject(INJECT_PORTAL_DOMAIN) private _portalDomain) {
    if (isLocalhost()) {
      if (TESTING_UAT_DOMAINS.includes(btoa(this._portalDomain))) {
        this._apiUrl = `https://${this._portalDomain}/_ac`;
      } else if (this._portalDomain) {
        //atob(DEFAULT_API_PROXY) +
        this._apiUrl = `https://${this._portalDomain}/_ac`;
        // this._apiUrl = `https://api.b3networks.com/_ac`;
      } else {
        this._apiUrl = atob(DEFAULT_API_PROXY) + `/_ac`;
      }
    } else if (!location.origin || location.origin === 'file://') {
      // for electron app
      this._apiUrl = atob(DEFAULT_API_PROXY) + '/_ac';
      this._storageBackdoorAPIUrl = 'https://storage.b3networks.com/_b'; // TODO not sure about this. need test more
    }
  }

  getPortalDomain() {
    return this.domainPortal;
  }
}
