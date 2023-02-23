import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { WorktimeComponent } from './worktime.component';

const routes: Routes = [{ path: '', component: WorktimeComponent }];

@NgModule({
  declarations: [WorktimeComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes), SharedUiMaterialModule]
})
export class CommsIvrSharedWorktimeModule {}
