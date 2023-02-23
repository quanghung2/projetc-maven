import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EmailAddress } from '@b3networks/api/workspace';
import { ENTER, TAB } from '@angular/cdk/keycodes';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'b3n-email-recipient',
  templateUrl: './recipient.component.html',
  styleUrls: ['./recipient.component.scss']
})
export class RecipientComponent implements OnInit {
  @Input() addresses: EmailAddress[] = [];
  @Input() label: 'To' | 'Cc' | 'Bcc' = 'To';
  @Input() placeHolder = '';
  @Input() set isRequired(required: boolean) {
    this.required = required;
    this.emailAddress.setValidators([required ? Validators.required : null]);
    this.emailAddress.updateValueAndValidity();
  }

  @Output() onAddAddress: EventEmitter<EmailAddress> = new EventEmitter<EmailAddress>();
  @Output() onRemoveAddress: EventEmitter<EmailAddress> = new EventEmitter<EmailAddress>();
  readonly separatorKeysCodes: number[] = [ENTER, TAB];
  required: boolean;
  form: UntypedFormGroup = new UntypedFormGroup({
    emailAddress: new UntypedFormControl('')
  });

  ngOnInit() {
    this.emailAddress.setValidators([Validators.email]);
  }

  addAddress() {
    if (this.emailAddress.valid && this.emailAddress.value) {
      this.onAddAddress.emit({
        name: '',
        address: this.emailAddress.value
      });
      this.emailAddress.setValue('');
    }
  }

  removeAddress(address: EmailAddress) {
    this.onRemoveAddress.emit(address);
  }

  get emailAddress(): AbstractControl {
    return this.form.get('emailAddress');
  }

  getErrorMessage() {
    if (!this.addresses.length && this.emailAddress.hasError('required')) {
      return 'Please enter at least 1 recipient';
    }

    return this.emailAddress.hasError('email') ? 'Not a valid email' : '';
  }
}
