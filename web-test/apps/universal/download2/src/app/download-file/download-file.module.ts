import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { DownloadFileComponent } from './download-file.component';

const routes: Routes = [
  {
    path: '',
    component: DownloadFileComponent,
    children: [{ path: '', component: DownloadFileComponent }]
  }
];

@NgModule({
  declarations: [DownloadFileComponent],
  imports: [CommonModule, RouterModule.forChild(routes), FlexModule, SharedCommonModule, SharedUiMaterialModule],
  exports: [DownloadFileComponent]
})
export class DownloadFileModule {}
