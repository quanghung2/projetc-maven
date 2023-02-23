import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, FormControl } from '@angular/forms';

@Directive({
  selector: '[permissibleLimits]',
  providers: [{ provide: NG_VALIDATORS, useExisting: PermissibleLimitsDirective, multi: true }]
})
export class PermissibleLimitsDirective implements Validator {
  @Input() allowedMin: number;
  @Input() allowedMax: number;

  validate(c: FormControl): { [key: string]: boolean } {
    const value = c.value;
    return value === null || value === undefined || (value >= this.allowedMin && value <= this.allowedMax)
      ? null
      : { unacceptable: true };
  }
}
