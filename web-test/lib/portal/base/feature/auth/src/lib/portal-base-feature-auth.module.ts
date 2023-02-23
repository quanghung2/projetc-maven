import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AuthComponent } from './auth/auth.component';
import { CreateNewPasswordComponent } from './create-new-password/create-new-password.component';
import { AddEmailComponent } from './login/add-email/add-email.component';
import { LoginComponent } from './login/login.component';
import { Login2faComponent } from './login/login2fa/login2fa.component';
import { LogoutComponent } from './logout/logout.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { TemplateAuthComponent } from './template-auth/template-auth.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { MsLoginButtonModule } from '@b3networks/portal/base/shared';

const routes: Route[] = [
  {
    path: '',
    component: AuthComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'signin', redirectTo: 'login' },
      { path: 'resetpassword', component: ResetPasswordComponent },
      { path: 'setpassword', component: CreateNewPasswordComponent },
      { path: 'verifyemail', component: VerifyEmailComponent },
      { path: 'logout', component: LogoutComponent }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    FlexLayoutModule,
    SharedUiMaterialModule,
    MsLoginButtonModule
  ],
  declarations: [
    AuthComponent,
    TemplateAuthComponent,
    LoginComponent,
    Login2faComponent,
    AddEmailComponent,
    ResetPasswordComponent,
    CreateNewPasswordComponent,
    VerifyEmailComponent,
    LogoutComponent
  ]
})
export class PortalBaseFeatureAuthModule {}
