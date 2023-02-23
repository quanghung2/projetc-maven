import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared';
import { EditTagComponent } from './edit-tag/edit-tag.component';
import { HeaderComponent } from './header.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    SharedUiMaterialModule,
    FlexLayoutModule,
    SharedModule
  ],
  declarations: [HeaderComponent, EditTagComponent],
  exports: [HeaderComponent, EditTagComponent]
})
export class HeaderModule {}
