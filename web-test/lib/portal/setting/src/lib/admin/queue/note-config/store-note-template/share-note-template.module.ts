import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { StoreItemComponent } from '../store-item/store-item.component';
import { StoreNoteTemplateComponent } from './store-note-template.component';

@NgModule({
  declarations: [StoreNoteTemplateComponent, StoreItemComponent],
  imports: [CommonModule, SharedCommonModule, SharedUiMaterialModule],
  exports: [StoreNoteTemplateComponent]
})
export class ShareNoteTemplateModule {}
