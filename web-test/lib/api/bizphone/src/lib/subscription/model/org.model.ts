export class Org {
  static readonly MAX_SETUP_STEP = 1;
  uuid: string;
  name: string;
  walletCurrencyCode: string;
  email: string;
  domain: string;
  setupStep: number;
  timezone: string;
  timeFormat: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get utcOffset(): string {
    return this.timezone ? this.timezone.substring(3, 8) : '+0800';
  }

  get isFinishedSetting() {
    return this.setupStep === Org.MAX_SETUP_STEP;
  }
}
