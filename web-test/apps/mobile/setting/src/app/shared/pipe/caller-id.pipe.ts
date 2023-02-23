import { Pipe, PipeTransform } from '@angular/core';

enum CallerIdType {
  EXISTED = 'existed-callerid',
  ASSIGN = 'assign-callerid',
  RANDOM = 'random-callerid',
  PRIVATE = 'private',
  REQUEST = 'request-callerid',
  RANDOM_SELECTED = 'random-selected'
}

@Pipe({
  name: 'callerIDPipe'
})
export class CallerIdPipe implements PipeTransform {
  transform(callerId: string): string {
    switch (callerId) {
      case CallerIdType.RANDOM:
        return 'Randomise caller ID';
      case CallerIdType.REQUEST:
      case CallerIdType.PRIVATE:
        return 'Private';
      default:
        return callerId;
    }
  }
}
