import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { PortalSharedModule } from '@b3networks/portal/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AddTeamMemberModalComponent } from './add-team-member-modal/add-team-member-modal.component';
import { ManagerMembersComponent } from './manager-members/manager-members.component';
import { ManagerTeamsComponent } from './manager-teams/manager-teams.component';

const routes: Route[] = [
  {
    path: '',
    component: ManagerTeamsComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,

    SharedUiMaterialModule,
    SharedCommonModule,
    PortalSharedModule
  ],
  declarations: [ManagerTeamsComponent, ManagerMembersComponent, AddTeamMemberModalComponent]
})
export class PortalOrgFeatureTeamModule {}
