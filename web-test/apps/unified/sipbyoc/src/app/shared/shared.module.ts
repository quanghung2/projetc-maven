import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';

const COMPONENT = [];

@NgModule({
  declarations: [COMPONENT],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedUiMaterialModule,
    SharedAuthModule,
    SharedCommonModule
  ],
  exports: [COMPONENT]
})
export class SharedModule {}
