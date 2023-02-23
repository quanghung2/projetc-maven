import { SortDirection } from '@b3networks/api/common';

export interface GetExtensionReq {
  keyword?: string;
  isAssigned?: boolean;
  isBypass?: boolean;
  hasSipGW?: boolean;
  hasCR?: boolean;
  outboundRuleId?: number;
  type?: EnumExtensionQueryType;
  extKeys?: string[];
  excludeExtKeys?: string[];
  sort?: SortDirection;
}

export enum EnumExtensionQueryType {
  NORMAL = 'NORMAL',
  CALL_CENTER = 'CALL_CENTER'
}
