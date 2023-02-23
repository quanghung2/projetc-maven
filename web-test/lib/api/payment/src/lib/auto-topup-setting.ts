export class AutoTopupSetting {
  gatewayCode: string;
  enable: boolean;
  renewalSubscription: boolean;
  lowerLimit: number; // 0 mean that lowerLimit = 0.2 * topupAmount
  topupAmount: number;

  constructor(obj?: Partial<AutoTopupSetting>) {
    Object.assign(this, obj);
  }
}
