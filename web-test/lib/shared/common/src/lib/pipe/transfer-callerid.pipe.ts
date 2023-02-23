import { Pipe, PipeTransform } from '@angular/core';

export enum EnumTransferCallerIdOption {
  EXT_KEY = 'EXT_KEY',
  CALLER_NUMBER = 'CALLER_NUMBER',
  ASSIGNED_CALLERID = 'ASSIGNED_CALLERID'
}

@Pipe({
  name: 'transferCallerId'
})
export class TransferCallerIDPipe implements PipeTransform {
  transform(text: string): any {
    switch (text) {
      case EnumTransferCallerIdOption.ASSIGNED_CALLERID:
        return 'Assigned CallerID';
      case EnumTransferCallerIdOption.CALLER_NUMBER:
        return 'Caller Number';
      case EnumTransferCallerIdOption.EXT_KEY:
        return 'Ext Key';
      default:
        return 'Caller Number';
    }
  }
}
