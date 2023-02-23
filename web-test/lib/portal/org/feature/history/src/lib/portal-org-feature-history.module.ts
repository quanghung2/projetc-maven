import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ActionBarComponent } from './history/action-bar/action-bar.component';
import { HistoryComponent } from './history/history.component';
import { ScopePipe } from './history/pipe/scope.pipe';
import { HistoryDetailComponent } from './history/history-detail/history-detail.component';

const routes: Route[] = [{ path: '', component: HistoryComponent }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    SharedUiMaterialModule,

    SharedAuthModule,
    SharedCommonModule
  ],
  declarations: [HistoryComponent, ActionBarComponent, ScopePipe, HistoryDetailComponent],
  providers: [],
  exports: [HistoryComponent]
})
export class PortalOrgSharedHistoryModule {}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    PortalOrgSharedHistoryModule
  ],
  declarations: [],
  providers: []
})
export class PortalOrgFeatureHistoryModule {}
