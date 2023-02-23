import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared';
import { ComplianceNoteComponent } from './compliance-note/compliance-note.component';
import { ComplianceComponent } from './compliance.component';

const routes: Routes = [
  {
    path: '',
    component: ComplianceComponent
  }
];

@NgModule({
  declarations: [ComplianceComponent, ComplianceNoteComponent],
  exports: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    SharedCommonModule,
    SharedUiMaterialModule,
    SharedAuthModule,
    SharedModule
  ]
})
export class ComplianceModule {}
