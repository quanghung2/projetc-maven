import { SipFeatures } from './sip-features.interface';
import { Account } from './sip-account.interface';
import { SipSubscription } from './sip-subscription.interface';

export interface SipInfo {
  account: Account;
  features: SipFeatures;
  subscription: SipSubscription;
  type: string;
}
