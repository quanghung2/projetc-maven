import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[phoneNumPattern]'
})
export class PhoneNumberDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    let regex: RegExp;

    if (
      [8, 46, 9, 27, 13, 110].indexOf(event.keyCode) !== -1 ||
      //backspace
      event.keyCode === 8 ||
      //delete
      event.keyCode === 46 ||
      // Allow: Ctrl+A
      (event.keyCode === 65 && (event.ctrlKey || event.metaKey)) ||
      // Allow: Ctrl+C
      (event.keyCode === 67 && (event.ctrlKey || event.metaKey)) ||
      // Allow: Ctrl+V
      (event.keyCode === 86 && (event.ctrlKey || event.metaKey)) ||
      // Allow: Ctrl+X
      (event.keyCode === 88 && (event.ctrlKey || event.metaKey))
      // Allow: home, end, left, right
      // || (event.keyCode >= 35 && event.keyCode <= 39)
      // Allow: external right key pad
      // || (event.keyCode >= 96 && event.keyCode <= 106)
    ) {
      // let it happen, don't do anything
      return;
    }

    regex = new RegExp(/^[0-9]$/);

    let regEx = new RegExp(regex);
    if (regEx.test(event.key)) {
      return;
    } else {
      event.preventDefault();
    }
  }
}
