import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AssignMemberDialogComponent } from './assign-member-dialog/assign-member-dialog.component';
import { EditCapabilitiesDialogComponent } from './edit-capabilities-dialog/edit-capabilities-dialog.component';
import { ProjectSettingsComponent } from './project-settings.component';
import { RenameProjectDialogComponent } from './rename-project-dialog/rename-project-dialog.component';

const routes: Routes = [{ path: '', component: ProjectSettingsComponent }];

@NgModule({
  declarations: [
    ProjectSettingsComponent,
    RenameProjectDialogComponent,
    EditCapabilitiesDialogComponent,
    AssignMemberDialogComponent
  ],
  imports: [CommonModule, RouterModule.forChild(routes), SharedUiMaterialModule, ReactiveFormsModule]
})
export class ProjectSettingsModule {}
