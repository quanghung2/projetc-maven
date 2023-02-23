import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { CustomMohComponent } from './custom-moh.component';

export const routes: Routes = [{ path: '', component: CustomMohComponent }];

@NgModule({
  declarations: [CustomMohComponent],
  imports: [
    CommonModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    RouterModule.forChild(routes),
    FormsModule,
    SharedUiMaterialModule,
    CommsSharedModule,
    SharedUiPortalModule
  ]
})
export class CustomMohModule {}
