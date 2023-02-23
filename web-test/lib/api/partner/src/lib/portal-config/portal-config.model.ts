export class PortalConfig {
  title: string;
  domain: string;

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

  constructor(data?: Partial<PortalConfig>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  get hasAtLeastOneItemToShow() {
    return (
      this.showPricing ||
      this.showMember ||
      this.showSubscription ||
      this.showUsageHistory ||
      this.showInvoice ||
      this.showAudit ||
      this.showReport
    );
  }
}
