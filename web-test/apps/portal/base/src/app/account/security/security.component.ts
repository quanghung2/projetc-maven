import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  IdentityProfile,
  ProfileOrg,
  SecurityCompliance,
  SecurityComplianceQuery,
  TfaInfo,
  TfaInfoQuery,
  TfaService
} from '@b3networks/api/auth';
import { SessionQuery, SessionService } from '@b3networks/portal/base/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { filter, takeUntil } from 'rxjs/operators';
import { ChangeMobileDialog } from './modal/change-mobile/change-mobile.component';
import { EmailModalSettingsComponent } from './modal/email-modal.component';
import { PasswordModalSettingsComponent } from './modal/password-modal.component';
import { TwoFaActionType } from './security.model';
import { AuthenticatorAppModal } from './twofa/authenticatorApp/authenticatorApp.component';
import { DeleteAuthenticatorAppModal } from './twofa/authenticatorApp/confirmDelete.component';
import { TwofaModalComponent } from './twofa/twofa-modal';

@Component({
  selector: 'b3n-account-security-settings',
  templateUrl: 'security.component.html',
  styleUrls: ['security.component.scss']
})
export class SecuritySettingsComponent extends DestroySubscriberComponent implements OnInit {
  profile: IdentityProfile;
  currentOrg: ProfileOrg;
  tfaInfo: TfaInfo;
  securityCompliance: SecurityCompliance;

  constructor(
    private sessionQuery: SessionQuery,
    private sessionSerice: SessionService,
    private tfaInfoQuery: TfaInfoQuery,
    private securityComplianceQuery: SecurityComplianceQuery,
    private dialog: MatDialog,
    private tfaService: TfaService
  ) {
    super();
  }

  ngOnInit() {
    this.sessionQuery.profile$.pipe(takeUntil(this.destroySubscriber$)).subscribe(profile => {
      if (profile && profile.uuid) {
        this.profile = profile;
      }
    });
    this.sessionQuery.currentOrg$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(org => org != null)
      )
      .subscribe(currentOrg => {
        if (currentOrg) {
          this.currentOrg = currentOrg;
        }
      });
    this.tfaInfoQuery.tfaInfo$.pipe(takeUntil(this.destroySubscriber$)).subscribe((response: TfaInfo) => {
      this.tfaInfo = response;
    });
    this.securityComplianceQuery.securityCompliance$
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe((response: SecurityCompliance) => {
        this.securityCompliance = response;
      });
  }

  setup2fa() {
    this.dialog
      .open(TwofaModalComponent, {
        width: '600px',
        data: {
          email: this.profile.email,
          tfaInfo: this.tfaInfo,
          mobileNumber: this.profile.mobileNumber,
          action: TwoFaActionType.ENABLE_TFA
        }
      })
      .afterClosed()
      .subscribe(() => {
        this.tfaService.get2FaInfo().subscribe();
      });
  }

  disable2fa() {
    this.dialog
      .open(TwofaModalComponent, {
        width: '600px',
        data: {
          email: this.profile.email,
          tfaInfo: this.tfaInfo,
          mobileNumber: this.profile.mobileNumber,
          action: TwoFaActionType.DISABLE_TFA
        }
      })
      .afterClosed()
      .subscribe(() => {
        this.tfaService.get2FaInfo().subscribe();
      });
  }

  createNewRecoveryCode() {
    this.dialog
      .open(TwofaModalComponent, {
        width: '600px',
        data: {
          email: this.profile.email,
          tfaInfo: this.tfaInfo,
          mobileNumber: this.profile.mobileNumber,
          action: TwoFaActionType.CREATE_RECOVERY_KEY
        }
      })
      .afterClosed()
      .subscribe(() => {
        this.tfaService.get2FaInfo().subscribe();
      });
  }

  swich2fa() {
    if (this.tfaInfo.tfaEnabled) {
      this.disable2fa();
    } else {
      this.setup2fa();
    }
  }

  deleteTotpSuccessful() {
    this.tfaInfo.totpActivated = false;
  }

  setupAuthenticatorSuccessful() {
    this.tfaInfo.totpActivated = true;
  }

  showEmailModal() {
    const dialogRef = this.dialog.open(EmailModalSettingsComponent, {
      width: '600px',
      data: {
        email: this.profile.email,
        unverifiedEmail: this.profile.unverifiedEmail,
        unverifiedEmailToken: this.profile.unverifiedEmailToken
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.sessionSerice.getProfile().subscribe(profile => {
          this.profile = profile;
        });
      }
    });
  }

  showMobileModal() {
    this.dialog
      .open(ChangeMobileDialog, {
        width: '500px',
        data: this.profile.mobileNumber || ''
      })
      .afterClosed()
      .subscribe(result => {
        if (result && result.success) {
          this.sessionSerice.getProfile().subscribe(profile => {
            this.profile = profile;
          });
        }
      });
  }

  showPasswordModal() {
    this.dialog.open(PasswordModalSettingsComponent, {
      width: '600px'
    });
  }

  showAuthenticatorModal() {
    this.dialog.open(AuthenticatorAppModal, {
      width: '600px'
    });
  }

  showDeleteAuthenticationModal() {
    this.dialog.open(DeleteAuthenticatorAppModal, {
      width: '600px'
    });
  }
}
