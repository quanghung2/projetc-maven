import { forwardRef, Inject, Injectable } from '@angular/core';
import { BackendService } from '../service/backend.service';
import { environment } from './../../../environments/environment';

const NUMBER_PATH = '/number/private/v1';

@Injectable()
export class MsNumber {
  private msEndpoint: string = environment.api.endpoint;

  private numbers: Object = new Object();

  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService
  ) {}

  getNumbers(subscriptions: Array<any>, force: boolean = false): Promise<any> {
    const waiters = [];

    subscriptions.forEach(sub => {
      const waiter = this.getNumber(sub);
      waiters.push(waiter);
    });

    return Promise.all(waiters).then(() => this.numbers);
  }

  getNumber(subscription: string, force: boolean = false): Promise<any> {
    return this.backendService
      .get(this.getEndpoint('/numbers'), {
        subscription
      })
      .then(data => {
        if ((<any[]>data).length > 0) {
          const number = data[0];
          this.numbers[subscription] = number;
        }
        return data;
      });
  }

  getNumberByAppId(appId: string, domain: string, force: boolean = false): Promise<any> {
    return this.backendService
      .get(this.getEndpoint('/numbers'), {
        numberState: 'Assigned',
        app: appId,
        domain
      })
      .then(data => {
        return data;
      });
  }

  getEndpoint(path: string) {
    return this.backendService.parseApiUrl(NUMBER_PATH + path, false, this.msEndpoint);
  }
}
