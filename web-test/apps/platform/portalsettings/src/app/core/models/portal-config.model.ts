export class PortalConfig {
  title: string;
  showMarketingSign: boolean;
  loginHeaderBackground: string;
  loginButtonBackground: string;

  showPricing: boolean;
  allowTopup: boolean;
  showStore: boolean;
  showMember: boolean;
  showSubscription: boolean;
  showInvoice: boolean;
  showUsageHistory: boolean;
  showSettings: boolean;
  sendSubscriptionNotification: boolean;
  sendSubscriptionNotificationToCustomer: boolean;
  showKnowledgeBase: boolean;
  showAudit: boolean;
  showReport: boolean;

  allowMemberImport: boolean;

  constructor(value: Object) {
    if (!!value) {
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          this[key] = value[key];
        }
      }
    }
  }
}
