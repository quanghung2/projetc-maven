import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { PortalMemberSettingSharedModule } from '../../shared/shared.module';
import { AddConsentNumberComponent } from './add-consent-number/add-consent-number.component';
import { ConsentManagementComponent } from './consent-management.component';
import { ExportConsentComponent } from './export-consent/export-consent.component';
import { UploadConsentComponent } from './upload-consent/upload-consent.component';

const routes: Route[] = [
  {
    path: '',
    component: ConsentManagementComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    DragDropModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    SharedAuthModule,
    PortalMemberSettingSharedModule
  ],
  declarations: [ConsentManagementComponent, UploadConsentComponent, AddConsentNumberComponent, ExportConsentComponent],
  entryComponents: [],
  exports: []
})
export class ConsentModule {
  constructor() {}
}
