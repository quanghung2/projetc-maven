import { Text2SpeechEntry } from '@b3networks/api/bizphone';
import { HashMap } from '@datorama/akita';
import { RingMode } from '../../enums';

export interface RingConfig {
  activatedDevices: string[]; // v2 ring mode
  blockAnonymous: boolean;
  enableCallWaiting: boolean;
  enableAutoAttendant: false;
  ringTime: number;
  busyRef: 'busy' | 'hangup';
  ringMode: RingMode;
  unansweredRef: 'unanswered' | 'hangup';
  speedDial: HashMap<string>;
  version: 'v2' | null; // set to v2 when update v2 property
  mohConfigs: MogConfigs;
}

export interface MogConfigs {
  entries: Text2SpeechEntry[];
  ringMode: string;
  ringTime: number;
}
