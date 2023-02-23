import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';

const MODULES = [CommonModule, FormsModule, ReactiveFormsModule, SharedUiMaterialModule, FlexLayoutModule];
const COMPONENTS = [];

@NgModule({
  declarations: [COMPONENTS],
  imports: [MODULES],
  exports: [MODULES, COMPONENTS]
})
export class SharedModule {}
