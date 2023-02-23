import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { Route, RouterModule } from '@angular/router';
import { STORE_CONFIG_TOKEN } from '@b3networks/api/dashboard';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiConfirmDialogModule } from '@b3networks/shared/ui/confirm-dialog';
import { SharedUiLoadingSpinnerModule } from '@b3networks/shared/ui/loading-spinner';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { UniversalDashboardFeatureWidgetModule } from '@b3networks/universal/dashboard/feature/widget';
import { GridsterModule } from 'angular-gridster2';
import { CardV2Component } from './dashboard-detail-v2/card-v2/card-v2.component';
import { DashboardDetailV2Component } from './dashboard-detail-v2/dashboard-detail-v2.component';
import { OtpVerifyComponent } from './dashboard-detail-v2/public-device/otp-verify/otp-verify.component';
import { PublicDeviceComponent } from './dashboard-detail-v2/public-device/public-device.component';
import { SelectDashboardComponent } from './dashboard-detail-v2/public-device/select-dashboard/select-dashboard.component';
import { DatetimeFilterComponent } from './dashboard-detail-v2/toolbar-v2/datetime-filter/datetime-filter.component';
import { ExtensionFilterComponent } from './dashboard-detail-v2/toolbar-v2/extension-filter/extension-filter.component';
import { IncludeNonQueueFilterComponent } from './dashboard-detail-v2/toolbar-v2/include-non-queue-filter/include-non-queue-filter.component';
import { QueueFilterComponent } from './dashboard-detail-v2/toolbar-v2/queue-filter/queue-filter.component';
import { StateFilterComponent } from './dashboard-detail-v2/toolbar-v2/state-filter/state-filter.component';
import { ToolbarV2Component } from './dashboard-detail-v2/toolbar-v2/toolbar-v2.component';
import { DashboardV2Component } from './dashboard-v2.component';
import { ManageAccessComponent } from './manage-access/manage-access.component';
import { StoreAccessComponent } from './manage-access/store-access/store-access.component';
import { QuestionsNamePipe } from './questions-name.pipe';
import { PreviewComponent } from './store-dashboard-v2/preview/preview.component';
import { SelectQuestionComponent } from './store-dashboard-v2/select-question/select-question.component';
import { SelectTemplateComponent } from './store-dashboard-v2/select-template/select-template.component';
import { StoreDashboardV2Component } from './store-dashboard-v2/store-dashboard-v2.component';
import { EditDeviceComponent } from './store-device/edit-device/edit-device.component';
import { StoreDeviceComponent } from './store-device/store-device.component';

const routes: Route[] = [
  {
    path: '',
    component: DashboardV2Component
  },
  {
    path: 'permission-management',
    loadChildren: () =>
      import('./permission-management/permission-management.module').then(m => m.PermissionManagementModule)
  }
];

@NgModule({
  declarations: [
    DashboardV2Component,
    QuestionsNamePipe,
    ToolbarV2Component,
    DashboardDetailV2Component,
    StoreDashboardV2Component,
    CardV2Component,
    QueueFilterComponent,
    DatetimeFilterComponent,
    IncludeNonQueueFilterComponent,
    StateFilterComponent,
    ExtensionFilterComponent,
    SelectTemplateComponent,
    SelectQuestionComponent,
    PreviewComponent,
    PublicDeviceComponent,
    SelectDashboardComponent,
    OtpVerifyComponent,
    StoreDeviceComponent,
    EditDeviceComponent,
    ManageAccessComponent,
    StoreAccessComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedAuthModule,
    SharedCommonModule,
    SharedUiConfirmDialogModule,
    SharedUiLoadingSpinnerModule,
    GridsterModule,
    UniversalDashboardFeatureWidgetModule,
    SharedUiMaterialModule,
    MatNativeDateModule
  ],
  providers: [
    {
      provide: STORE_CONFIG_TOKEN,
      useValue: {
        width: '750px',
        height: '600px',
        panelClass: 'store__dashboard2'
      }
    }
  ]
})
export class UniversalDashboardFeatureDashboardV2Module {}
