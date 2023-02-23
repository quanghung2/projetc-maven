import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({ selector: '[middleclick]' })
export class MiddleclickDirective {
  @Output() middleclick = new EventEmitter();

  constructor() {}

  @HostListener('mouseup', ['$event'])
  middleclickEvent(event) {
    if (event.which === 2) {
      this.middleclick.emit(event);
      return false;
    } else {
      return true;
    }
  }
}
