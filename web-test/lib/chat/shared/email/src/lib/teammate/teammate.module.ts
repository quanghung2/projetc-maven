import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ClipboardModule } from 'ngx-clipboard';
import { EmailSharedModule } from '../shared/email-shared.module';
import { TeammateConvoComponent } from './teammate-convo/teammate-convo.component';

const routes: Route[] = [
  {
    path: ':id',
    component: TeammateConvoComponent
  }
];

@NgModule({
  declarations: [TeammateConvoComponent],
  imports: [
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    ClipboardModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    EmailSharedModule,
    ChatSharedCoreModule
  ]
})
export class TeammateModule {}
