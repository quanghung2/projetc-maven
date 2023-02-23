import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { AddEmailRequest, AuthenticationService } from '@b3networks/api/auth';
import { PortalConfig } from '@b3networks/api/partner';
import { MessageConstants } from '@b3networks/shared/common';

@Component({
  selector: 'pba-add-email',
  templateUrl: './add-email.component.html',
  styleUrls: ['./add-email.component.scss']
})
export class AddEmailComponent implements OnInit {
  @Input() config: PortalConfig;
  @Output() updatedEmail = new EventEmitter<boolean>();

  verifyEmailForm: UntypedFormGroup;
  showErrorSummary = false;
  showSuccessSummary = false;
  indicator = false;
  error: string;

  get email(): UntypedFormControl {
    return this.verifyEmailForm.get('email') as UntypedFormControl;
  }

  getErrorEmail() {
    if (this.email.hasError('required')) return 'Please enter your email';
    else if (this.email.hasError('pattern')) return 'Email is invalid';
    else return '';
  }

  constructor(private fb: UntypedFormBuilder, private authenticationService: AuthenticationService) {}

  ngOnInit(): void {
    this.verifyEmailForm = this.fb.group({
      email: ['', Validators.compose([Validators.required, Validators.email])]
    });
  }

  verifyEmail() {
    if (this.verifyEmailForm.valid) {
      this.indicator = true;
      this.authenticationService.addEmail(<AddEmailRequest>{ email: this.email.value }).subscribe(
        _ => {
          this.indicator = false;
          this.showSuccessSummary = true;
          this.updatedEmail.emit(true);
        },
        error => {
          this.indicator = false;
          if (error.code) {
            if (error.code == 'auth.emailAlreadyRegistered') {
              this.error = 'Email already registered';
            } else {
              this.error = MessageConstants.GENERAL_ERROR;
            }
          } else {
            this.error = MessageConstants.GENERAL_ERROR;
          }
          this.showErrorSummary = true;
        }
      );
    }
  }
}
