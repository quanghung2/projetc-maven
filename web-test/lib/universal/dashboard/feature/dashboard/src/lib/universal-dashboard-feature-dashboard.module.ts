import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { Route, RouterModule } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiConfirmDialogModule } from '@b3networks/shared/ui/confirm-dialog';
import { SharedUiLoadingSpinnerModule } from '@b3networks/shared/ui/loading-spinner';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { UniversalDashboardFeatureWidgetModule } from '@b3networks/universal/dashboard/feature/widget';
import { GridsterModule } from 'angular-gridster2';
import { CardComponent } from './card/card.component';
import { DashboardDetailToolbarComponent } from './dashboard-detail-toolbar/dashboard-detail-toolbar.component';
import { AddCardComponent } from './dashboard-detail/add-card/add-card.component';
import { DashboardDetailComponent } from './dashboard-detail/dashboard-detail.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PublicAccessComponent } from './public-access/public-access.component';
import { StoreDashboardComponent } from './store-dashboard/store-dashboard.component';

const routes: Route[] = [
  { path: '', component: DashboardComponent },
  { path: ':uuid', component: DashboardDetailComponent }
];

@NgModule({
  declarations: [
    DashboardComponent,
    DashboardDetailComponent,
    AddCardComponent,
    StoreDashboardComponent,
    CardComponent,
    DashboardDetailToolbarComponent,
    PublicAccessComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedAuthModule,
    SharedCommonModule,
    SharedUiConfirmDialogModule,
    SharedUiLoadingSpinnerModule,
    UniversalDashboardFeatureWidgetModule,
    GridsterModule,
    FlexLayoutModule,
    SharedUiMaterialModule,
    LayoutModule,
    MatNativeDateModule
  ]
})
export class UniversalDashboardFeatureDashboardModule {}
