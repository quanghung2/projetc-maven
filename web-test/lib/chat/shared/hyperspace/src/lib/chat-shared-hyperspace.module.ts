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
import { HyperspaceContentComponent } from './hyperspace/hyperspace-content/hyperspace-content.component';
import { HyperspaceDetailsComponent } from './hyperspace/hyperspace-details/hyperspace-details.component';
import { HyperspaceMembersComponent } from './hyperspace/hyperspace-details/hyperspace-members/hyperspace-members.component';
import { HyperspaceStorageSharedFilesComponent } from './hyperspace/hyperspace-details/hyperspace-storage-shared-files/hyperspace-storage-shared-files.component';
import { HyperspaceThumbnailFileComponent } from './hyperspace/hyperspace-details/hyperspace-storage-shared-files/hyperspace-thumbnail-file/hyperspace-thumbnail-file.component';
import { HyperspaceFooterComponent } from './hyperspace/hyperspace-footer/hyperspace-footer.component';
import { HyperspaceHeaderComponent } from './hyperspace/hyperspace-header/hyperspace-header.component';
import { HyperspaceComponent } from './hyperspace/hyperspace.component';
import { HyperspacesComponent } from './hyperspaces.component';

const routes: Route[] = [
  {
    path: '',
    component: HyperspacesComponent,
    children: [{ path: ':hyperId/:id', component: HyperspaceComponent }]
  }
];

@NgModule({
  declarations: [
    HyperspacesComponent,
    HyperspaceContentComponent,
    HyperspaceHeaderComponent,
    HyperspaceDetailsComponent,
    HyperspaceFooterComponent,
    HyperspaceComponent,
    HyperspaceStorageSharedFilesComponent,
    HyperspaceThumbnailFileComponent,
    HyperspaceMembersComponent
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
export class ChatSharedHyperspaceModule {}
