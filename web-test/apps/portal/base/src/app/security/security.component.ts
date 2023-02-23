import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  ProfileOrg,
  SecurityCompliance,
  SecurityComplianceQuery,
  SecurityService,
  TfaInfo,
  TfaInfoQuery,
  TfaService,
  UpdatePersonalRequestBuilder
} from '@b3networks/api/auth';
import { SessionQuery, SessionService } from '@b3networks/portal/base/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UpdatePersonalError } from '../account/security/modal/password-modal.component';
import { TwoFaActionType } from '../account/security/security.model';
import { TwofaModalComponent } from '../account/security/twofa/twofa-modal';

@Component({
  selector: 'b3n-security-policy',
  templateUrl: 'security.component.html',
  styleUrls: ['security.component.scss']
})
export class SecurityPolicyComponent extends DestroySubscriberComponent implements OnInit {
  currentOrg: ProfileOrg;
  tfaInfo: TfaInfo;
  securityComplianceInput: SecurityCompliance;

  securityCompliance: SecurityCompliance;
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  error = new UpdatePersonalError();
  continueProcessing = false;

  errorIconClass = 'cancel red';
  warningIconClass = 'error yellow';

  progressing: boolean;

  constructor(
    private tfaQuery: TfaInfoQuery,
    private tfaService: TfaService,
    private compliantQuery: SecurityComplianceQuery,
    private securityService: SecurityService,
    private sessionQuery: SessionQuery,
    private sessionService: SessionService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private router: Router
  ) {
    super();
  }

  ngOnInit() {
    combineLatest([this.tfaQuery.tfaInfo$, this.compliantQuery.securityCompliance$, this.sessionQuery.currentOrg$])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([tfaInfo, compliant, currentOrg]) => {
        this.tfaInfo = tfaInfo;
        this.securityCompliance = compliant;
        this.currentOrg = currentOrg;
      });

    this.tfaService.get2FaInfo().subscribe();
    this.securityService.getSecurityCompliance().subscribe();
  }

  getErrorIssueNumber() {
    let count = 0;
    if (this.isPasswordComplexityError() || this.isPasswordPromError()) {
      count++;
    }
    if (this.isTfaError()) {
      count++;
    }
    return count;
  }

  getWarningIssueNumber() {
    let count = 0;
    if (this.isPasswordPromWarning()) {
      count++;
    }
    if (this.isTfaWarning()) {
      count++;
    }
    return count;
  }

  getHeaderHint() {
    const errorNumber = this.getErrorIssueNumber();
    const warningNumber = this.getWarningIssueNumber();
    if (errorNumber > 0 && warningNumber > 0) {
      return `${errorNumber} error(s) and ${warningNumber} warning(s)`;
    }
    if (errorNumber > 0) {
      return `${errorNumber} error(s)`;
    }
    if (warningNumber > 0) {
      return `${warningNumber} warning(s)`;
    }
    return '';
  }

  resetError() {
    this.error = new UpdatePersonalError();
  }

  setup2fa() {
    const profile = this.sessionQuery.profile;
    this.dialog
      .open(TwofaModalComponent, {
        width: '600px',
        data: {
          email: profile.email,
          tfaInfo: this.tfaInfo,
          mobileNumber: profile.mobileNumber,
          action: TwoFaActionType.ENABLE_TFA
        }
      })
      .afterClosed()
      .subscribe(() => {
        this.tfaService.get2FaInfo().subscribe();
      });
  }

  deleteTotpSuccessful() {
    this.tfaInfo.totpActivated = false;
  }

  setupAuthenticatorSuccessful() {
    this.tfaInfo.totpActivated = true;
  }

  updatePersonal() {
    if (this.validate()) {
      this.progressing = true;
      const updatePersonalRequest = new UpdatePersonalRequestBuilder().createUpdatePersonalRequestForPassword(
        this.oldPassword,
        this.newPassword
      );
      this.sessionService.updatePersonalInfo(updatePersonalRequest).subscribe(
        _ => {
          this.toastService.success('Your password has been successfully updated. Please login with your new password');
          // this.slideUp('passwordContent');
          //TODO slide up password
          this.securityCompliance.passwordUpdatePrompt = false;
          this.securityCompliance.passwordUpdateRequired = false;
          this.progressing = true;
        },
        error => {
          this.progressing = false;
          const data = error.error;
          if (data.code === 'auth.AccessDenied') {
            this.error.oldPassword = 'Old password is incorrect';
          } else if (data.code === 'auth.violatedSecurityPolicy.password_reuse_not_allowed') {
            this.error.serverError = 'New password cannot be the same as previous passwords.';
          } else {
            this.error.serverError = data.message;
          }
        }
      );
    }
  }

  private validate() {
    this.error = new UpdatePersonalError();
    if (!this.oldPassword) {
      this.error.oldPassword = 'Please enter your old password';
    }
    if (!this.newPassword) {
      this.error.newPassword = 'Please enter your new password';
    } else if (this.newPassword !== this.confirmNewPassword) {
      this.error.confirmPassword = 'Your new password and confirm password do not match';
    }

    return !this.error.hasError();
  }

  isPasswordPromWarning() {
    return this.securityCompliance.passwordUpdatePrompt && this.securityCompliance.passwordDaysBeforeExpiry > 0;
  }

  isPasswordPromError() {
    return this.securityCompliance.passwordUpdatePrompt && this.securityCompliance.passwordDaysBeforeExpiry <= 0;
  }

  isPasswordComplexityError() {
    return this.securityCompliance.passwordUpdateRequired;
  }

  isPasswordRequire() {
    return this.isPasswordComplexityError() || this.securityCompliance.passwordUpdatePrompt;
  }

  isTfaError() {
    return (this.currentOrg.isPartner || this.securityCompliance.tfaRequired) && !this.tfaInfo.tfaEnabled;
  }

  isTfaWarning() {
    return !this.securityCompliance.tfaRequired && !this.tfaInfo.tfaEnabled && !this.currentOrg.isPartner;
  }

  getPasswordClass() {
    if (this.isPasswordComplexityError()) {
      return this.errorIconClass;
    } else {
      if (this.isPasswordPromError()) {
        return this.errorIconClass;
      }
      if (this.isPasswordPromWarning()) {
        return this.warningIconClass;
      }
    }
    return null;
  }

  getTfaClass() {
    if (this.isTfaError()) {
      return this.errorIconClass;
    } else if (this.isTfaWarning()) {
      return this.warningIconClass;
    }
    return 'check circle';
  }

  continue() {
    this.continueProcessing = true;
    this.securityService.getSecurityCompliance().subscribe(
      response => {
        this.securityCompliance = response;
        if (this.getErrorIssueNumber() > 0) {
          this.toastService.warning('Please update security issues before continue.');
        } else {
          this.router.navigate(['home']);
        }
        this.continueProcessing = false;
      },
      error => {
        this.continueProcessing = false;
        this.toastService.warning('The application has encountered an unknown error. Please try again later.');
      }
    );
  }
}
