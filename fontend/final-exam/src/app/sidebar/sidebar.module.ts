import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '../common/material-share/shared-ui-material.module';
import { SidebarComponent } from './sidebar.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    SharedUiMaterialModule,
    FlexLayoutModule
  ],
  declarations: [SidebarComponent],
  exports: [SidebarComponent]
})
export class HeaderModule {}
