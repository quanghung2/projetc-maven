import { Workflow } from '@b3networks/api/ivr';
import { EventMessage } from '@b3networks/shared/utils/message';

export class WorkflowChangedEvent implements EventMessage {
  workflow: Workflow;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
