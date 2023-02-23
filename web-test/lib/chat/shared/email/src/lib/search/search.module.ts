import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClipboardModule } from 'ngx-clipboard';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedCommonModule } from '@b3networks/shared/common';
import { EmailSharedModule } from '../shared/email-shared.module';
import { EmailSearchResultComponent } from './search-result/search-result.component';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SearchComponent } from './search.component';

@NgModule({
  declarations: [
    SearchComponent,
    EmailSearchResultComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    ClipboardModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    EmailSharedModule,
    ChatSharedCoreModule,
  ],
  exports: [SearchComponent]
})
export class SearchModule {}
