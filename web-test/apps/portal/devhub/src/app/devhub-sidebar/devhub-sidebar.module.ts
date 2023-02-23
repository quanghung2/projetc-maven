import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { DevhubSidebarComponent } from './devhub-sidebar.component';

@NgModule({
  declarations: [DevhubSidebarComponent],
  exports: [DevhubSidebarComponent],
  imports: [CommonModule, SharedUiMaterialModule, ReactiveFormsModule, RouterModule]
})
export class DevhubSidebarModule {}
