import { Directive, HostListener, Injector, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[b3nRetrictInput]'
})
export class RetrictInputDirective {
  @Input()
  set b3nRetrictInput(value) {
    this.regExpr = new RegExp(value);
  }

  private _oldvalue = '';
  private regExpr: any;
  private control: NgControl;
  constructor(injector: Injector) {
    try {
      this.control = injector.get(NgControl);
    } catch (e) {}
  }
  @HostListener('input', ['$event'])
  change($event) {
    const item = $event.target;
    const value = item.value;
    let pos = item.selectionStart; //get the position of the cursor
    const matchvalue = value;
    const noMatch: boolean = value && !this.regExpr.test(matchvalue);
    if (noMatch) {
      item.selectionStart = item.selectionEnd = pos - 1;
      if (item.value.length < this._oldvalue.length && pos === 0) pos = 2;
      if (this.control) this.control.control.setValue(this._oldvalue, { emit: false });

      item.value = this._oldvalue;
      item.selectionStart = item.selectionEnd = pos - 1; //recover the position
    } else this._oldvalue = value;
  }
}
