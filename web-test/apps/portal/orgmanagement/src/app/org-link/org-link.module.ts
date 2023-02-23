import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ClipboardModule } from 'ngx-clipboard';
import { OrgLinkDetailsComponent } from './org-link-details/org-link-details.component';
import { OrgLinkComponent } from './org-link.component';
import { OrgLinkInviteComponent } from './org-link-invite/org-link-invite.component';

const routes: Routes = [{ path: '', component: OrgLinkComponent }];

@NgModule({
  declarations: [OrgLinkComponent, OrgLinkDetailsComponent, OrgLinkInviteComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    SharedUiMaterialModule,
    SharedAuthModule,
    ClipboardModule
  ]
})
export class OrgLinkModule {}
