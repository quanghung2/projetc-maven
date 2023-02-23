export class Subscription {
  agentLicenceQuota: number;
  supervisorLicenceQuota: number;
  isActive: boolean;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  get hasLicence() {
    return this.isActive && this.agentLicenceQuota + this.supervisorLicenceQuota > 0;
  }
}
