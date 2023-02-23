import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { BillingCycleDialogComponent } from './billing-cycle-dialog/billing-cycle-dialog.component';
import { RemoveMemberDialogComponent } from './remove-member-dialog/remove-member-dialog.component';
import { ResubscribeDialogComponent } from './resubscribe-dialog/resubscribe-dialog.component';
import { SubscriptionDetailComponent } from './subscription-detail/subscription-detail.component';
import { SubscriptionListComponent } from './subscription-list/subscription-list.component';
import { SubscriptionComponent } from './subscription/subscription.component';
import { UnsubscribeDialogComponent } from './unsubscribe-dialog/unsubscribe-dialog.component';
import { ViewNumberComponent } from './view-number/view-number.component';
import { ViewUsersComponent } from './view-users/view-users.component';

const routes: Route[] = [{ path: '', component: SubscriptionComponent }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedUiMaterialModule
  ],
  declarations: [
    SubscriptionComponent,
    UnsubscribeDialogComponent,
    ResubscribeDialogComponent,
    ViewNumberComponent,
    ViewUsersComponent,
    RemoveMemberDialogComponent,
    BillingCycleDialogComponent,
    SubscriptionListComponent,
    SubscriptionDetailComponent
  ]
})
export class PortalOrgFeatureSubscriptionModule {}
