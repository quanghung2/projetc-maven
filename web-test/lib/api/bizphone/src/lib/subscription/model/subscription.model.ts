import { License, UsageLicense } from './license.model';
import { Org } from './org.model';
import { User } from './user.model';

export class SubscriptionBiz {
  user: User;
  org: Org;
  usageLicense: UsageLicense;
  license: License;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.user = new User(obj?.user);
      this.org = new Org(obj?.org);
      this.usageLicense = new UsageLicense(obj?.usageLicense);
      this.license = new License(obj?.license);
    }
  }

  static defaultSub(): SubscriptionBiz {
    const defaultSub = new SubscriptionBiz();
    defaultSub.user = new User();
    defaultSub.org = new Org();
    defaultSub.usageLicense = new UsageLicense();
    defaultSub.license = new License();
    return defaultSub;
  }
}
