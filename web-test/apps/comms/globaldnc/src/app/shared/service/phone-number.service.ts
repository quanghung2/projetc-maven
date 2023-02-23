import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PhoneNumberService {
  constructor() {}

  public correctNumber(number: string) {
    let numberWithoutPlus = number.replace(/\D+/g, '');
    if (this.isSingaporeNumber(numberWithoutPlus) && numberWithoutPlus.length == 8) {
      return '+65' + numberWithoutPlus;
    } else {
      return '+' + numberWithoutPlus;
    }
  }

  public isSingaporeNumber(number: string) {
    let trippedNumber: string = number.replace(/\D+/g, '');
    return (
      (trippedNumber.length == 8 && !!trippedNumber.match(/^[3689].*/)) ||
      (trippedNumber.length == 10 && !!trippedNumber.match(/^65[3689].*/)) ||
      (trippedNumber.length == 11 && !!trippedNumber.match(/^\+65[3689].*/))
    );
  }
}
