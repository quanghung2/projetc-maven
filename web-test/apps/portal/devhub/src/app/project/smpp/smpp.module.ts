import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SmppComponent } from './smpp.component';

const routes: Routes = [{ path: '', component: SmppComponent }];

@NgModule({
  declarations: [SmppComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedCommonModule
  ]
})
export class SmppModule {}
