import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capabilitiesDisplay'
})
export class CapabilitiesDisplayPipe implements PipeTransform {
  transform(capapbilities: any, args?: any): any {
    let display = [];
    for (var capability in capapbilities) {
      if (capapbilities[capability]) {
        display.push(capability);
      }
    }
    return display.join(', ');
  }
}
