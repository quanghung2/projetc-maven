import { forwardRef, Inject, Injectable } from '@angular/core';
import { CRSubscription } from '../model';
import { BackendService } from '../service/backend.service';
import { environment } from './../../../environments/environment';

const SUBSCRIPTION_PATH = '/subscription/private/v3';

@Injectable()
export class MsSubscription {
  private msEndpoint: string = environment.api.endpoint;

  private subscriptions: Array<CRSubscription> = new Array();

  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService
  ) {}

  getAll(force: boolean = false): Promise<any> {
    if (!force && this.subscriptions.length > 0) {
      return Promise.resolve(this.subscriptions);
    }

    return this.backendService
      .get(this.backendService.parseApiUrl(SUBSCRIPTION_PATH + '/subscriptions', false, this.msEndpoint), {
        includeAll: true
      })
      .then((data: any) => {
        this.subscriptions = data;
        return data;
      });
  }
}
