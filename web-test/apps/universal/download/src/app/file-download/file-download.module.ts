import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, Routes } from '@angular/router';
import { LocalStorageUtil, SharedCommonModule } from '@b3networks/shared/common';
import { FileDownloadComponent } from './file-download.component';

const routes: Routes = [
  {
    path: ':key',
    component: FileDownloadComponent
  },
  {
    path: '',
    redirectTo: LocalStorageUtil.getItem('download_file_key'),
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [FileDownloadComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatProgressSpinnerModule,
    MatButtonModule,
    SharedCommonModule,
    FlexModule,
    MatIconModule
  ],
  exports: [FileDownloadComponent]
})
export class FileDownloadModule {}
