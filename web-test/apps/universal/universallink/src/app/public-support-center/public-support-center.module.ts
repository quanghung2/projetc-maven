import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { PublicAccessGuard } from '../core/services/public-access.guard';
import { PublicSupportCenterComponent } from './public-support-center.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: PublicSupportCenterComponent,
        canActivate: [PublicAccessGuard]
      }
    ]),
    SharedUiMaterialModule
  ],
  declarations: [PublicSupportCenterComponent]
})
export class PublicSupportCenterModule {}
