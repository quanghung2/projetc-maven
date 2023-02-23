import { DialPlanDetail } from './outbound-rule';

export class MasterDialPlan {
  id: string;
  countryCode: string;
  planDetail: DialPlanDetail;
  isChecked: boolean;

  constructor(obj?: any) {
    if (obj) {
      if (obj.planDetail) {
        obj.planDetail = new DialPlanDetail(obj.planDetail);
      }

      Object.assign(this, obj);
    }
  }
}
