import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CommsIvrSharedCoreModule } from '../core/core.model';
import { MissedCallNotificationComponent } from './missed-call-notification.component';

const routes: Route[] = [{ path: '', component: MissedCallNotificationComponent }];

@NgModule({
  declarations: [MissedCallNotificationComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    FormsModule,
    SharedUiMaterialModule,
    CommsIvrSharedCoreModule
  ]
})
export class MissedCallNotificationModule {}
