import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { QuillModule } from 'ngx-quill';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { EmailSharedModule } from '../shared/email-shared.module';
import { ComposeEmailMessageComponent } from './compose.component';
import { PreviousEmailContentComponent } from './previous-email-content/previous-email-content.component';

@NgModule({
  declarations: [ComposeEmailMessageComponent, PreviousEmailContentComponent],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    EmailSharedModule,
    QuillModule.forRoot(),
    NgxSkeletonLoaderModule.forRoot()
  ]
})
export class ComposeModule {}
