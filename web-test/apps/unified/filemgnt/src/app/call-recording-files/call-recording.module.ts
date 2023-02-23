import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CallRecordingComponent } from '../call-recording-files/call-recording.component';
import { CommonFolderModule } from '../common-component/common-folder/common-folder.module';

const routes: Routes = [
  {
    path: '',
    component: CallRecordingComponent
  }
];

@NgModule({
  declarations: [CallRecordingComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedUiMaterialModule,
    SharedCommonModule,
    CommonFolderModule,
    RouterModule.forChild(routes)
  ]
})
export class CallRecordingModule {}
