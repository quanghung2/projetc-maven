import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared';
import { ActivityLogsComponent } from './activity-logs/activity-logs.component';
import { BulkFilteringComponent } from './bulk-filtering.component';
import { HistoryBulkFilteringComponent } from './history-bulk-filtering/history-bulk-filtering.component';
import { InfoUploadComponent } from './info-upload/info-upload.component';
import { UploadNumbersComponent } from './upload-numbers/upload-numbers.component';

const routes: Routes = [
  {
    path: '',
    component: BulkFilteringComponent
  }
];

@NgModule({
  declarations: [
    BulkFilteringComponent,
    UploadNumbersComponent,
    InfoUploadComponent,
    HistoryBulkFilteringComponent,
    ActivityLogsComponent
  ],
  exports: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    SharedCommonModule,
    SharedUiMaterialModule,
    SharedModule,
    SharedAuthModule
  ]
})
export class BulkFilteringModule {}
