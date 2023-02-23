import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AccessDeniedComponent } from './access-denied.component';

@NgModule({
  declarations: [AccessDeniedComponent],
  imports: [CommonModule, SharedUiMaterialModule],
  exports: [AccessDeniedComponent]
})
export class AccessDeniedModule {}
