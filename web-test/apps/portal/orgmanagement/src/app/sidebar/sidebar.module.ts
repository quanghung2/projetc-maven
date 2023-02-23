import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { PhotoModule } from '@b3networks/portal/org/feature/settings';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SidebarComponent } from './sidebar.component';

@NgModule({
  declarations: [SidebarComponent],
  exports: [SidebarComponent],
  imports: [CommonModule, RouterModule, FlexLayoutModule, SharedUiMaterialModule, PhotoModule, SharedAuthModule]
})
export class SidebarModule {}
