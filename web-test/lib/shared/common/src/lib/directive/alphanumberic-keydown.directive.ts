import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[alphanumbericKeydown]'
})
export class AlphanumbericKeydownDirective {
  constructor() {}

  @HostListener('keydown', ['$event'])
  onKeyDown(e) {
    const key = e.key as string;

    if (!key.match(/^[a-zA-Z0-9]*$/)) {
      e.preventDefault();
    }
  }
}
