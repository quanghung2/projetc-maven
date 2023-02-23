import { forwardRef, Inject, Injectable } from '@angular/core';
import { CRSubscription } from '../model/subscription.model';
import { BackendService } from '../service/backend.service';
import { environment } from './../../../environments/environment';

const SUBSCRIPTION_PATH = '/auth/private/v1';

@Injectable()
export class MsAuth {
  private msEndpoint: string = environment.api.endpoint;
  private users: Array<CRSubscription> = new Array();

  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService
  ) {}

  getOrgMembers(orgUuid: string, force: boolean = false): Promise<any> {
    if (!force && this.users.length > 0) {
      return Promise.resolve(this.users);
    }

    return this.backendService
      .get(
        this.backendService.parseApiUrl(
          `${SUBSCRIPTION_PATH}/organizations/${orgUuid}/members`,
          false,
          this.msEndpoint
        ),
        {}
      )
      .then((data: any) => {
        this.users = data;
        return data;
      });
  }
}
