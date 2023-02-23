import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';

const SYSTEM_KEYS = [8, 9, 13, 16, 17, 18, 20, 27, 32, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46];
const SYSTEM_SHORCUT_KEYS = ['a', 'c', 'v', 'x'];

@Directive({
  selector: '[inputNumberKeydown]'
})
export class InputNumberKeydownDirective {
  @Input() replacedKey: string;
  @Input() inputFormControl: FormControl | AbstractControl;

  constructor(private elementRef: ElementRef) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(e) {
    if (SYSTEM_KEYS.includes(e.keyCode) || (e.ctrlKey && SYSTEM_SHORCUT_KEYS.includes(e.key))) {
      return;
    }

    if (this.inputFormControl) {
      const handleReplacedKeyResult = this.handleReplacedKey(e);

      if (!handleReplacedKeyResult) {
        return;
      }
    }

    if (isNaN(e.key) && !SYSTEM_KEYS.includes(e.keyCode)) {
      e.preventDefault();
    }
  }

  handleReplacedKey(e) {
    if (this.replacedKey === e.key) {
      this.inputFormControl.setValue(e.key);
      e.preventDefault();
      return false;
    }

    if (this.replacedKey !== e.key && this.elementRef.nativeElement.value.includes(this.replacedKey)) {
      if (isNaN(e.key) && !SYSTEM_KEYS.includes(e.keyCode)) {
        e.preventDefault();
      } else {
        this.inputFormControl.setValue('');
      }
    }

    return true;
  }
}
