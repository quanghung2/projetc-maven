import { RingMode } from '../../enums';

export interface CfConfig {
  // v1 config
  isEnablePhoneNum: boolean;
  isEnableExt: boolean;
  isEnableExceptions: boolean;

  // v2 config
  forwardList: string[];
  ringMode: RingMode;
  ringTime: number;
  version: 'v2' | null; // set to v2 when upload v2 property
}
