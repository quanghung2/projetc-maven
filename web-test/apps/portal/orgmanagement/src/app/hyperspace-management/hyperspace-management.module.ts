import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { UiScrollModule } from 'ngx-ui-scroll';
import { AddUserHyperspaceModalComponent } from './add-user-hyperspace-modal/add-user-hyperspace-modal.component';
import { CreateHyperspaceComponent } from './create-hyperspace/create-hyperspace.component';
import { HyperspaceManagementDetailComponent } from './hyperspace-management-detail/hyperspace-management-detail.component';
import { HyperspaceManagementComponent } from './hyperspace-management.component';

const routes: Route[] = [
  {
    path: '',
    component: HyperspaceManagementComponent
  }
];

@NgModule({
  declarations: [
    HyperspaceManagementComponent,
    CreateHyperspaceComponent,
    HyperspaceManagementDetailComponent,
    AddUserHyperspaceModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    SharedCommonModule,
    SharedUiToastModule,

    ChatSharedCoreModule,

    SharedUiMaterialModule,
    SharedUiPortalModule,
    InfiniteScrollModule,
    UiScrollModule,
    SharedAuthModule
  ]
})
export class HyperspaceManagementModule {}
