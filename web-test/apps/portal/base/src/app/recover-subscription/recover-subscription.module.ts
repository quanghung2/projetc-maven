import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { Route, RouterModule } from '@angular/router';
import { PortalSharedModule } from '@b3networks/portal/shared';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { FinishComponent } from './finish/finish.component';
import { RecoverMatchHeightDirective } from './recover-match-height.directive';
import { RecoverSubscriptionComponent } from './recover-subscription.component';
import { SelectSubscriptionComponent } from './select-subscription/select-subscription.component';

const routes: Route[] = [{ path: '', component: RecoverSubscriptionComponent }];

@NgModule({
  imports: [CommonModule, SharedUiMaterialModule, FlexLayoutModule, RouterModule.forChild(routes), PortalSharedModule],
  declarations: [
    SelectSubscriptionComponent,
    FinishComponent,
    RecoverSubscriptionComponent,
    RecoverMatchHeightDirective
  ]
})
export class RecoverSubscriptionModule {}
