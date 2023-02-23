import { forwardRef, Inject, Injectable } from '@angular/core';
import { BackendService } from '../service/backend.service';
import { environment } from './../../../environments/environment';

@Injectable()
export class AppSip {
  private msEndpoint: string = environment.api.endpoint;
  private sipPath: string = environment.api.sipPath;

  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService
  ) {}

  getConfig(subscriptionUuid: string): Promise<any> {
    return this.backendService.get(`/private/v2/subscriptions/${subscriptionUuid}/config`);
  }

  setConfig(subscriptionUuid: string, config: any): Promise<any> {
    return this.backendService.put(`/private/v2/subscriptions/${subscriptionUuid}/config`, config);
  }

  getEndpoint(path: string) {
    return this.backendService.parseApiUrl(this.sipPath + path, false, this.msEndpoint);
  }
}
