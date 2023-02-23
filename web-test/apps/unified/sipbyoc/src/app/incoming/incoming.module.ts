import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared';
import { IncomingComponent } from './incoming.component';
import { ReportUploadComponent } from './report-upload/report-upload.component';
import { StoreIncomingSettingComponent } from './store-incoming-setting/store-incoming-setting.component';
import { UploadBulkRoutingComponent } from './upload-bulk-routing/upload-bulk-routing.component';

const routes: Route[] = [
  {
    path: '',
    component: IncomingComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedUiMaterialModule,
    SharedUiMaterialNativeDateModule,
    SharedModule
  ],
  declarations: [IncomingComponent, StoreIncomingSettingComponent, UploadBulkRoutingComponent, ReportUploadComponent],
  entryComponents: [],
  providers: [],
  exports: []
})
export class IncomingModule {
  constructor() {}
}
