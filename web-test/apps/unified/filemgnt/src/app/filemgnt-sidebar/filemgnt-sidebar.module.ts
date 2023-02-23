import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { FilemgntSidebarComponent } from './filemgnt-sidebar.component';

@NgModule({
  declarations: [FilemgntSidebarComponent],
  exports: [FilemgntSidebarComponent],
  imports: [CommonModule, SharedUiMaterialModule, RouterModule]
})
export class FilemgntSidebarModule {}
