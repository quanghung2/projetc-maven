import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, zip } from 'rxjs';
import { map, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';
import { AuthOrganizationService } from '../../core/services';
import { PartnerService } from './../../core/services/partner.service';
import { AuthService } from './../../core/services/private-http/auth.service';
import { InvoiceBillingInfo } from './invoice-billing-info.model';
import { PartnerInfo } from './partner-info.model';
import { Settings } from './settings.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private sttObs: Observable<Settings>;
  private partnerObs: Observable<PartnerInfo>;

  constructor(
    private httpClient: HttpClient,
    private partnerService: PartnerService,
    private authService: AuthService,
    private authOrgService: AuthOrganizationService
  ) {}

  getDomainSettings(): Observable<Settings> {
    if (this.sttObs == null) {
      this.sttObs = this.httpClient.get(`/invoice/private/v2/settings`).pipe(
        map(o => this.toSettings(o)),
        publishReplay(1),
        refCount()
      );
    }

    return this.sttObs;
  }

  updateDomainSettings(stt: Settings): Observable<any> {
    return this.httpClient.put(`/invoice/private/v2/settings`, stt).pipe(tap(() => this.clearCache()));
  }

  clearCache() {
    this.sttObs = null;
  }

  private toSettings(r): Settings {
    const stt = new Settings();
    Object.assign(stt, r);
    return stt;
  }

  getPartnerInfo(): Observable<PartnerInfo> {
    if (this.partnerObs == null) {
      this.partnerObs = this.partnerService.getDomain().pipe(
        switchMap(p => {
          const partner = new PartnerInfo();
          partner.domain = p['domain'];
          partner.uuid = p['partnerUuid'];
          partner.logo = p['logoUrl'];
          partner.supportedCurrencies = p['supportedCurrencies'] ? p['supportedCurrencies'] : new Array<string>();
          return zip(of(partner), this.authOrgService.getOrganization(partner.uuid), this.authService.getCountries());
        }),
        map(([partnerInfo, org, countries]) => {
          partnerInfo.name = org.name;
          const invoiceBillingInfo = new InvoiceBillingInfo();
          partnerInfo.billingInfo = invoiceBillingInfo;

          invoiceBillingInfo.address1 = org.billingInfo.addressLineOne;
          invoiceBillingInfo.address2 = org.billingInfo.addressLineTwo;
          invoiceBillingInfo.city = org.billingInfo.city;
          invoiceBillingInfo.country = countries.find(c => c.code === org.billingInfo.countryCode);
          invoiceBillingInfo.name = org.billingInfo.name;
          invoiceBillingInfo.state = org.billingInfo.state;
          invoiceBillingInfo.zip = org.billingInfo.zip;
          invoiceBillingInfo.emails = org.billingInfo.emails;
          return partnerInfo;
        }),
        publishReplay(1),
        refCount()
      );
    }

    return this.partnerObs;
  }
}
