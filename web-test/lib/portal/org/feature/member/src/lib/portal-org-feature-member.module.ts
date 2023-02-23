import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_CHIPS_DEFAULT_OPTIONS } from '@angular/material/chips';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { MemberDetailModule } from './member-detail/member-detail.module';
import { ActionBarComponent } from './members/action-bar/action-bar.component';
import { AddMemberComponent } from './members/add-member/add-member.component';
import { ExportMembersComponent } from './members/export-members/export-members.component';
import { ImportMembersComponent } from './members/import-members/import-members.component';
import { MembersComponent } from './members/members.component';
import { SharedAuthModule } from '@b3networks/shared/auth';

const routes: Route[] = [{ path: '', component: MembersComponent }];

@NgModule({
  declarations: [
    MembersComponent,
    ActionBarComponent,
    AddMemberComponent,
    MembersComponent,
    ExportMembersComponent,
    ImportMembersComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    SharedCommonModule,
    SharedUiMaterialModule,

    MemberDetailModule,
    SharedAuthModule
  ],
  providers: [
    {
      provide: MAT_CHIPS_DEFAULT_OPTIONS,
      useValue: {
        separatorKeyCodes: [ENTER, COMMA]
      }
    }
  ]
})
export class PortalOrgFeatureMemberModule {}
