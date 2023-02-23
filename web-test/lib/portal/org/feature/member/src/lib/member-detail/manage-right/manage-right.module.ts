import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AssignTeamDialogComponent } from './assign-team-dialog/assign-team-dialog.component';
import { ManageRightComponent } from './manage-right.component';

@NgModule({
  declarations: [ManageRightComponent, AssignTeamDialogComponent],
  imports: [CommonModule, ReactiveFormsModule, SharedCommonModule, SharedUiMaterialModule],
  exports: [ManageRightComponent]
})
export class ManageRightModule {}
