import { Source } from '@b3networks/api/ivr';
import { EventMessage } from '@b3networks/shared/utils/message';

export class SourceChangeEvent implements EventMessage {
  source: Source;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
