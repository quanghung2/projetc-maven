import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CommonFolderModule } from '../common-component/common-folder/common-folder.module';
import { VoicemailComponent } from './voicemail.component';

const routes: Routes = [
  {
    path: '',
    component: VoicemailComponent
  }
];

@NgModule({
  declarations: [VoicemailComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedUiMaterialModule,
    SharedCommonModule,
    CommonFolderModule,
    RouterModule.forChild(routes)
  ]
})
export class VoiceMailModule {}
