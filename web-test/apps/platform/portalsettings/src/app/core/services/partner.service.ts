import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PortalConfig } from '../models/portal-config.model';
import { UpdateSenderEmail } from '../models/update-sender-email.model';
import { environment } from './../../../environments/environment';
import { PartnerDomain } from './../models/partner.model';
import { CacheService } from './cache.service';
import { PrivateHttpService } from './private-http.service';

export interface UpdateDomainRequest {
  supportEmail?: string;
  salesEmail?: string;
  logoUrl?: string;
  faviconUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class PartnerService extends PrivateHttpService {
  constructor(private httpClient: HttpClient, private cacheService: CacheService) {
    super();
  }

  getBucket(): Observable<string> {
    return this.cacheService.get(
      'getBucket',
      this.httpClient
        .get(this.constructFinalEndpoint('/portal/private/v1/info'))
        .pipe(map(res => res['bucket'] as string)),
      600000
    );
  }

  updateDomain(request: UpdateDomainRequest) {
    return this.httpClient.put(this.constructFinalEndpoint('/partner/private/v1/app/domain'), request);
  }

  getPortalConfig() {
    return this.httpClient
      .get<PortalConfig>(this.constructFinalEndpoint('/partner/private/v1/portalConfig'))
      .pipe(map(res => new PortalConfig(res)));
  }

  updatePortalConfig(config: PortalConfig) {
    return this.httpClient
      .put<PortalConfig>(this.constructFinalEndpoint('/partner/private/v1/app/portalConfig'), config)
      .pipe(map(res => new PortalConfig(res)));
  }

  changeSenderEmail(email: string) {
    const payload = {
      senderEmail: email
    };

    return this.httpClient.post(
      this.constructFinalEndpoint('/partner/private/v1/app/partner/updateSenderEmail'),
      payload
    );
  }

  getChangeSenderEmailStatus() {
    return this.httpClient
      .get<any>(this.constructFinalEndpoint('/partner/private/v1/app/partner/updateSenderEmail'))
      .pipe(map(res => new UpdateSenderEmail(res)));
  }

  getDomain(): Observable<PartnerDomain> {
    return this.httpClient
      .get(this.constructFinalEndpoint('/partner/private/v2/app/domain'))
      .pipe(map(res => new PartnerDomain(res)));
  }

  canAccessApp(): Observable<boolean> {
    return this.cacheService.get(
      'canAccessApp',
      this.httpClient
        .get(this.constructFinalEndpoint(`/partner/private/v2/appaccess/${environment.appId}`))
        .pipe(map(res => res['canAccess'])),
      600000
    );
  }

  canAccessInvoiceApp(): Observable<boolean> {
    return this.cacheService.get(
      'canAccessAppInvoice',
      this.httpClient
        .get(this.constructFinalEndpoint(`/partner/private/v2/appaccess/${environment.invoiceAppId}`))
        .pipe(map(res => res['canAccess'])),
      600000
    );
  }
}
