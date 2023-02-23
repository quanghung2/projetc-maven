import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appName'
})
export class AppNamePipe implements PipeTransform {
  private appFriendlyName = {
    rI7ukOeAvYhZfFrh: 'Call Recording',
    R8vdwGEirnQ607EV: 'Direct Line',
    Xs8NlapmKZVCoCv7: 'Direct Line Beta',
    KwaKqO8kkkTjGUXT: 'SIP',
    F6geHvW8SI2Ymni2: 'SIP Beta',
    '4ESLmjmXaWH0jcxT': 'Virtual Line',
    VOPvlNMkkVizJmwu: 'Virtual Line Beta',
    f7bhafA3hB6xiBvJ: 'SMS Marketing',
    CCX3URU5XqiPhK9l: 'SMS Marketing Beta',
    '1FXekqSRnDZ5p5hm': 'Fax',
    iRaGV9pDvamvJOy8: 'Fax Beta',
    san2cniYRfz8JWYw: 'Conference',
    pFPLIRBxI2ujdWtK: 'Conference Beta'
  };

  transform(value: any, args?: any): any {
    let friendlyName = this.appFriendlyName[value];
    if (friendlyName) {
      return friendlyName;
    } else {
      return value;
    }
  }
}
