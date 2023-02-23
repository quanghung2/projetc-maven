import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FindSubscriptionReq } from '../model';
import { BackendService } from './backend.service';

@Injectable()
export class SubscriptionLicenseService {
  constructor(private backendServices: BackendService) {}
  /**
   *
   * @param req
   */
  findSubscriptions(req: FindSubscriptionReq) {
    return this.backendServices.get(
      this.backendServices.parseApiUrl(`/subscription/private/v3/v2/subscriptions`, false, environment.api.endpoint),
      { productId: req.productId }
    );
  }
}
