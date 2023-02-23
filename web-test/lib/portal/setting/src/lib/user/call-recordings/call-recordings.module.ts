import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { CallRecordingsComponent } from './call-recordings.component';

const routes: Routes = [{ path: '', component: CallRecordingsComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    FormsModule,
    CommsSharedModule,
    SharedUiPortalModule
  ],
  declarations: [CallRecordingsComponent]
})
export class CallRecordingsModule {}
