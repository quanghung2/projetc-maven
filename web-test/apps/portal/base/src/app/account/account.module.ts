import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { QRCodeModule } from 'angularx-qrcode';
import { SharedModule } from '../shared/shared.module';
import { AccountComponent } from './account.component';
import { LoginActivityComponent } from './activity/login-activity.component';
import { AccountInformationSettingsComponent } from './information/information.component';
import { ChangeMobileDialog } from './security/modal/change-mobile/change-mobile.component';
import { EmailModalSettingsComponent } from './security/modal/email-modal.component';
import { PasswordModalSettingsComponent } from './security/modal/password-modal.component';
import { SecuritySettingsComponent } from './security/security.component';
import { AuthenticatorAppModal } from './security/twofa/authenticatorApp/authenticatorApp.component';
import { DeleteAuthenticatorAppModal } from './security/twofa/authenticatorApp/confirmDelete.component';
import { TwofaSaveRecoveryCodeSettingsComponent } from './security/twofa/enable/saverecoverycode';
import { TwofaVerifyEmailSettingsComponent } from './security/twofa/otpFlow/verifyemail';
import { TwofaModalComponent } from './security/twofa/twofa-modal';
import { TrustedDeviceComponent } from './trusted-device/trusted-device.component';

const routes: Route[] = [
  {
    path: '',
    component: AccountComponent,
    children: [
      { path: 'profile', component: AccountInformationSettingsComponent },
      { path: 'security', component: SecuritySettingsComponent },
      { path: 'activity', component: LoginActivityComponent },
      { path: 'trusted-browsers', component: TrustedDeviceComponent },
      { path: '', redirectTo: 'profile', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  declarations: [
    AccountComponent,
    AccountInformationSettingsComponent,
    SecuritySettingsComponent,
    LoginActivityComponent,
    ChangeMobileDialog,
    EmailModalSettingsComponent,
    PasswordModalSettingsComponent,
    AuthenticatorAppModal,
    DeleteAuthenticatorAppModal,
    TwofaSaveRecoveryCodeSettingsComponent,
    TwofaVerifyEmailSettingsComponent,
    TwofaModalComponent,
    TrustedDeviceComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedUiToastModule,
    SharedModule,
    SharedAuthModule,
    FlexLayoutModule,
    SharedUiMaterialModule,
    QRCodeModule
  ]
})
export class AccountModule {}
