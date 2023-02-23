import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { PortalOrgSharedHistoryModule } from '@b3networks/portal/org/feature/history';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CallHistoryComponent } from './call-history.component';

const routes: Route[] = [{ path: '', component: CallHistoryComponent }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    SharedAuthModule,
    SharedCommonModule,
    PortalOrgSharedHistoryModule
  ],
  declarations: [CallHistoryComponent],
  providers: []
})
export class CallHistoryModule {}
