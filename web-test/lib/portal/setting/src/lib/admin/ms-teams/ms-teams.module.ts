import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { Route, RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ActivateLicenseDialogComponent } from './activate-license-dialog/activate-license-dialog.component';
import { CheckProvisionComponent } from './check-provision/check-provision.component';
import { ConfirmLinkDialogComponent } from './confirm-link-dialog/confirm-link-dialog.component';
import { LinkMsAccountDialogComponent } from './link-ms-account-dialog/link-ms-account-dialog.component';
import { MassConfigurationDialogComponent } from './mass-configuration-dialog/mass-configuration-dialog.component';
import { MsScriptDialogComponent } from './ms-script-dialog/ms-script-dialog.component';
import { MsTeamsComponent } from './ms-teams.component';
import { ProfileDialogComponent } from './profile-dialog/profile-dialog.component';
import { RevokeMsAuthComponent } from './revoke-ms-auth/revoke-ms-auth.component';

const routes: Route[] = [
  {
    path: '',
    component: MsTeamsComponent
  }
];

@NgModule({
  declarations: [
    MsTeamsComponent,
    ProfileDialogComponent,
    MsScriptDialogComponent,
    LinkMsAccountDialogComponent,
    ConfirmLinkDialogComponent,
    MassConfigurationDialogComponent,
    ActivateLicenseDialogComponent,
    RevokeMsAuthComponent,
    CheckProvisionComponent
  ],
  exports: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    FlexLayoutModule,
    MatDialogModule
  ]
})
export class MsTeamsModule {}
