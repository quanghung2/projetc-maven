import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared';
import { HeaderComponent } from './header.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LayoutModule,
    SharedUiMaterialModule,
    FlexLayoutModule,
    SharedModule
  ],
  declarations: [HeaderComponent],
  exports: [HeaderComponent]
})
export class HeaderModule {}
