import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { CompliantFlagService, EnumActionCompliant } from './../shared/service/compliant-flag.service';

@Component({
  selector: 'app-compliant-flag',
  templateUrl: './compliant-flag.component.html',
  styleUrls: ['./compliant-flag.component.scss']
})
export class CompliantFlagComponent implements OnInit {
  errorMessages = {
    isPhoneNumber: 'Phone number is number!',
    maxLength: 'Max length number is 16!'
  };
  validators = [checkNumber.bind(this), checkSizePhone.bind(this)];

  constructor(public service: CompliantFlagService) {}

  ngOnInit() {}

  onAddPhone($event) {
    const phone = this.convertPhone($event.value);
    this.service.addOrRemovePhone(phone, EnumActionCompliant.ADD).subscribe();
  }

  convertPhone(phone: string) {
    if (phone[0] === '+') {
      return phone;
    }
    return `+${phone}`;
  }

  onRemovePhone($event) {
    this.service.addOrRemovePhone($event, EnumActionCompliant.REMOVE).subscribe();
  }
}

export function checkNumber(control: UntypedFormControl) {
  const value = control.value;
  if (!value || value === '' || value === '+') {
    return null;
  }
  const reg = new RegExp(/^\+{0,1}[0-9]*$/);
  if (value.match(reg)) {
    return null;
  }
  return { isPhoneNumber: true };
}

export function checkSizePhone(control: UntypedFormControl) {
  const value = control.value;
  const max = 16;
  if (value && value.length > max) {
    return { maxLength: true };
  }
  return null;
}
