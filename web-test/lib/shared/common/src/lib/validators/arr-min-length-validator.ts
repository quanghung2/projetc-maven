import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function arrMinLengthValidator(minLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value && control.value.length) {
      return control.value.length >= minLength ? null : { arrMinLength: true };
    } else {
      return { arrMinLength: true };
    }
  };
}
