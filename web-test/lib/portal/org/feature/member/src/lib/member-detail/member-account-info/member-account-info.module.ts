import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ChangeMemberRoleDialogComponent } from './change-member-role-dialog/change-member-role-dialog.component';
import { ChangeUsernameDialogComponent } from './change-username-dialog/change-username-dialog.component';
import { CreateCredentialComponent } from './create-credential/create-credential.component';
import { MemberAccountInfoComponent } from './member-account-info.component';
import { SetPasswordDialogComponent } from './set-password-dialog/set-password-dialog.component';
import { TransferOwnerDialogComponent } from './transfer-owner-dialog/transfer-owner-dialog.component';

@NgModule({
  declarations: [
    MemberAccountInfoComponent,
    CreateCredentialComponent,
    ChangeUsernameDialogComponent,
    SetPasswordDialogComponent,
    TransferOwnerDialogComponent,
    ChangeMemberRoleDialogComponent
  ],
  imports: [CommonModule, FormsModule, SharedCommonModule, SharedUiMaterialModule],
  exports: [MemberAccountInfoComponent]
})
export class MemberAccountInfoModule {}
