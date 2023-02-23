import { forwardRef, Inject, Injectable } from '@angular/core';
import { BackendService } from '../service/backend.service';
import { environment } from './../../../environments/environment';

@Injectable()
export class AppDirectLine {
  private msEndpoint: string = environment.api.endpoint;
  private directLinePath: string = environment.api.directLinePath;

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
    return this.backendService.parseApiUrl(this.directLinePath + path, false, this.msEndpoint);
  }
}
