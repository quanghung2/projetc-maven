import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, FormControl } from '@angular/forms';

@Directive({
  selector: '[maxInputLength]',
  providers: [{ provide: NG_VALIDATORS, useExisting: MaxLengthDirective, multi: true }]
})
export class MaxLengthDirective implements Validator {
  @Input() maxLength: number;

  validate(c: FormControl): { [key: string]: boolean } {
    const value = c.value;
    const length = typeof c.value === 'number' ? Math.ceil(Math.log10(value + 1)) : value?.length;
    return length > this.maxLength ? { maxLength: true } : null;
  }
}
