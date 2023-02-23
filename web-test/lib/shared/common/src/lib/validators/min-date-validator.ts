import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function minDateValidator(minDate: Date): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value) {
      const date = new Date(control.value);
      return date >= minDate ? null : { minDate: true };
    } else {
      return null;
    }
  };
}
