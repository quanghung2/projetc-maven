import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class DeactivateGuard implements CanDeactivate<any> {
  canDeactivate(component: any): boolean {
    return component.canDeactivate();
    // console.log(component.canDeactivate());
    // return component.canDeactivate();
  }
}
