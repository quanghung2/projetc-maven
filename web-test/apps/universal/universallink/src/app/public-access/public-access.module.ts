import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { PublicAccessGuard } from '../core/services/public-access.guard';
import { PublicAccessComponent } from './public-access.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: 'phone-setting',
        component: PublicAccessComponent,
        canActivate: [PublicAccessGuard]
      },
      { path: '', redirectTo: 'phone-setting', pathMatch: 'full' }
    ]),
    SharedUiMaterialModule
  ],
  declarations: [PublicAccessComponent]
})
export class PublicAccessModule {}
