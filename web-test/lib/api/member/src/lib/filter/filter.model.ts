import { MemberStatus } from '../enum';

export interface MemberFilter {
  status: MemberStatus;
  search: string;
}
