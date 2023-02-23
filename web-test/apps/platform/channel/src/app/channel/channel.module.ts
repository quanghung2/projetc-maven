import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { ClipboardModule } from 'ngx-clipboard';
import { AddProductModalComponent } from './add-product-modal/add-product-modal.component';
import { ChannelComponent } from './channel.component';
import { EditTagModalComponent } from './edit-tag-modal/edit-tag-modal.component';
import { FilterTagsPipe } from './edit-tag-modal/filter-tag.pipe';
import { ExportSubscriptionModalComponent } from './export-subscription-modal/export-subscription-modal.component';
import { ListChannelComponent } from './list-channel/list-channel.component';

const routes: Route[] = [
  {
    path: '',
    component: ChannelComponent,
    children: [
      {
        path: '',
        component: ListChannelComponent
      },
      {
        path: 'detail/:partnerUuid',
        loadChildren: () => import('./details-channel/details-channel.module').then(m => m.DetailsChannelModule)
      }
    ]
  }
];

@NgModule({
  declarations: [
    ListChannelComponent,
    ChannelComponent,
    EditTagModalComponent,
    AddProductModalComponent,
    ExportSubscriptionModalComponent,
    FilterTagsPipe
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    SharedUiMaterialNativeDateModule
  ]
})
export class ChannelModule {}
