import { forwardRef, Inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AppType, CRSubscription } from '../model';
import { AppBizPhone } from '../repo/app-bizphone.service';
import { AppDirectLine } from '../repo/app-directline.service';
import { AppSip } from '../repo/app-sip.service';
import { AppVirtualLine } from '../repo/app-virtualline.service';
import { BackendService } from './backend.service';

const SUBSCRIPTION_PATH = '/private/v2/subscriptions';

@Injectable()
export class SubscriptionService {
  private msEndpoint: string = environment.api.endpoint;

  private subscriptions: Array<any>;
  private numbers: Array<Object>;

  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService,
    private appVirtualLine: AppVirtualLine,
    private appDirectLine: AppDirectLine,
    private appSip: AppSip,
    private appBizPhone: AppBizPhone
  ) {}

  getSubscriptions(force: boolean = false) {
    if (!force && this.subscriptions != undefined) {
      return Promise.resolve(this.subscriptions);
    }
    return this.backendService.get(SUBSCRIPTION_PATH).then((data: any) => {
      const subs = [];
      const subBps = [];
      const subApps = [];
      data.forEach((sub: CRSubscription) => {
        if (sub.plan != undefined && sub.plan.name == 'number_of_bp_ext') {
          subBps.push(sub);
        } else if (sub.assignedApp != undefined) {
          subApps.push(sub);
        } else {
          subs.push(sub);
        }
      });

      this.subscriptions = subBps.concat(subApps).concat(subs);
      return this.subscriptions;
    });
  }

  getCRSubscription() {
    return this.backendService.get(SUBSCRIPTION_PATH + '/callrecording/plan');
  }

  getNumbers(force: boolean = false) {
    if (!force && this.numbers != undefined) {
      return Promise.resolve(this.filterSubscriptionNumber(this.numbers));
    }
    return this.backendService.get(SUBSCRIPTION_PATH + '/assign-available').then(numbers => {
      this.numbers = <any[]>numbers;
      return this.filterSubscriptionNumber(this.numbers);
    });
  }

  private filterSubscriptionNumber(numbers: Array<any>) {
    const subNumbers = this.subscriptions
      .map(sub => sub.assignedTo)
      .filter(number => number != undefined && number != '');
    const response = numbers.filter(number => {
      return !subNumbers.includes(number.assignTo);
    });
    return response;
  }

  assignNumber(uuid, data) {
    return this.backendService.put(SUBSCRIPTION_PATH + '/' + uuid, {
      assignTo: data.assignTo,
      assignApp: data.assignApp
    });
  }

  unassignNumber(uuid) {
    return this.backendService.delete(SUBSCRIPTION_PATH + '/' + uuid);
  }

  getConfig(subscription: CRSubscription) {
    let app;
    if (subscription.plan.name == 'number_of_bp_ext') {
      app = AppType.BIZ_PHONE;
    } else {
      app = subscription.assignedApp;
    }
    app = app.toLowerCase();

    if (app == AppType.VIRTUAL_LINE) {
      if (subscription.assignedTo == undefined) {
        return null;
      }
      return this.appVirtualLine.getConfig(subscription.uuid);
    } else if (app == AppType.DIRECT_LINE) {
      return this.appDirectLine.getConfig(subscription.uuid);
    } else if (app == AppType.SIP) {
      return this.appSip.getConfig(subscription.uuid);
    } else if (app == AppType.BIZ_PHONE) {
      return this.appBizPhone.getConfig();
    }
    return null;
  }

  setConfig(subscription: CRSubscription, config) {
    let app;
    if (subscription.assignedApp == undefined && subscription.plan.name == 'number_of_bp_ext') {
      app = AppType.BIZ_PHONE;
    } else {
      app = subscription.assignedApp;
    }
    app = app.toLowerCase();

    if (app == AppType.VIRTUAL_LINE) {
      return this.appVirtualLine.setConfig(subscription.uuid, config);
    } else if (app == AppType.DIRECT_LINE) {
      return this.appDirectLine.setConfig(subscription.uuid, config);
    } else if (app == AppType.SIP) {
      return this.appSip.setConfig(subscription.uuid, config);
    } else if (app == AppType.BIZ_PHONE) {
      return this.appBizPhone.setConfig(config);
    }
    return null;
  }
}
