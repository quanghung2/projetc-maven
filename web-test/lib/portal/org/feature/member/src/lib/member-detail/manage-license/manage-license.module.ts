import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AssignLicenseComponent } from './assign-license/assign-license.component';
import { ManageLicenseComponent } from './manage-license.component';

@NgModule({
  declarations: [ManageLicenseComponent, AssignLicenseComponent],
  imports: [CommonModule, ReactiveFormsModule, SharedCommonModule, SharedUiMaterialModule],
  exports: [ManageLicenseComponent]
})
export class ManageLicenseModule {}
