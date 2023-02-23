import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { CommsCallcenterSharedModule } from '@b3networks/comms/callcenter/shared';
import { PortalOrgSharedHistoryModule } from '@b3networks/portal/org/feature/history';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared';
import { CampaignDetailComponent } from './campaign-detail/campaign-detail.component';
import { CampaignComponent } from './campaign.component';
import { ConcurrentCallComponent } from './concurrent-call/concurrent-call.component';
import { ConfirmChangeStatusComponent } from './confirm-change-stt/confirm-change-stt.component';
import { DeleteCampaignComponent } from './delete-campaign/delete-campaign.component';
import { DuplicateCampaignDialogComponent } from './duplicate-campaign-dialog/duplicate-campaign-dialog.component';
import { NumbersDetailComponent } from './numbers-detail/numbers-detail.component';
import { UploadNumbersComponent } from './numbers-detail/upload-numbers/upload-numbers.component';
import { ForceHangupPipe } from './numbers-management/force-hangup.pipe';
import { NumbersManagementComponent } from './numbers-management/numbers-management.component';
import { ReportCampaignComponent } from './report-campaign/report-campaign.component';
import { ScheduleCampaignComponent } from './schedule-campaign/schedule-campaign.component';
import { StoreCampaignComponent } from './store-campaign/store-campaign.component';
import { WorktimeCampaignComponent } from './worktime-campaign/worktime-campaign.component';

const routes: Route[] = [
  {
    path: '',
    component: CampaignComponent
  },
  { path: ':numberListId', component: NumbersManagementComponent },
  { path: 'report/:numberListId', component: ReportCampaignComponent }
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
    SharedUiMaterialNativeDateModule,
    SharedModule,
    CommsCallcenterSharedModule,
    PortalOrgSharedHistoryModule
  ],
  declarations: [
    CampaignComponent,
    NumbersManagementComponent,
    DuplicateCampaignDialogComponent,
    DeleteCampaignComponent,
    UploadNumbersComponent,
    ConfirmChangeStatusComponent,
    StoreCampaignComponent,
    ScheduleCampaignComponent,
    ForceHangupPipe,
    WorktimeCampaignComponent,
    ConcurrentCallComponent,
    NumbersDetailComponent,
    CampaignDetailComponent,
    ReportCampaignComponent
  ],
  providers: [DatePipe],
  exports: []
})
export class CampaignModule {
  constructor() {}
}
