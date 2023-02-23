import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SipAccount, SipTrunkService } from '@b3networks/api/callcenter';
import { MyErrorStateMatcher } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

export interface ResetPasswordInput {
  sip: SipAccount;
}

@Component({
  selector: 'b3n-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  title = 'Reset password';
  visibility = true;
  selectOpt = this.fb.control('auto');
  password = this.fb.control('', [
    Validators.minLength(14),
    Validators.required,
    PatternValidator(/[A-Z]{1,}/, {
      hasCapitalCase: true
    }),
    PatternValidator(/[a-z]{1,}/, {
      hasSmallCase: true
    }),
    PatternValidator(/\d{1,}/, {
      hasNumber: true
    })
  ]);
  matcher = new MyErrorStateMatcher();

  newPassword: string;

  @ViewChild('inputPassword') inputPassword: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ResetPasswordInput,
    private toastService: ToastService,
    private sipTrunkService: SipTrunkService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.selectOpt.valueChanges.subscribe(value => {
      if (value === 'create') {
        setTimeout(() => {
          this.inputPassword?.nativeElement?.focus();
        }, 300);
      }
    });
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  reset() {
    this.sipTrunkService
      .resetPassword(this.data.sip.sipUsername, this.selectOpt.value === 'create' ? this.password.value : null)
      .subscribe(
        text => {
          this.newPassword = text;
        },
        err => {
          try {
            const json = JSON.parse(err);
            this.toastService.error(json.message);
          } catch (error) {}
        }
      );
  }
}

function PatternValidator(regex: RegExp, error: ValidationErrors): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } => {
    if (!control.value) {
      return null;
    }
    const valid = regex.test(control.value);
    return valid ? null : error;
  };
}
