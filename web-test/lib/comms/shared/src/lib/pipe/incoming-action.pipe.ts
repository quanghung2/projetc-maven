import { Pipe, PipeTransform } from '@angular/core';
import { IncomingAction } from '@b3networks/api/bizphone';

@Pipe({
  name: 'incomingAction'
})
export class IncomingActionPipe implements PipeTransform {
  transform(device: any): string {
    switch (device) {
      case IncomingAction.CALL_DELEGATION:
        return 'Ring Delegates';
      case IncomingAction.CALL_FORWARDING:
        return 'Forward Calls';
      case IncomingAction.NO_SET:
        return 'No set';
      case IncomingAction.RING_DEVICES:
        return 'Ring Devices';
      case IncomingAction.RING_DEVICES_AND_SIP_GATEWAY:
        return 'Ring Devices and Sip Gateway';
      case IncomingAction.RING_SIP_GATEWAY:
        return 'Sip Gateway';
      default:
        return device;
    }
  }
}
