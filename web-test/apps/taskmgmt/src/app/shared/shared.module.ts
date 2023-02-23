import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { CkeditorRenderComponent } from './component/ckEditor-legacy/ckeditor-render.component';
import { UploadDialogComponent } from './component/upload-dialog/upload-dialog.component';

import { EditorComponent } from './component/editor/editor.component';
import { SearchMemberComponent } from './component/search-member/search-member.component';
import { LazyLoadDirective } from './directive/lazyload-dom.directive';
import { MiddleclickDirective } from './directive/middlelcik.directive';

const directives = [LazyLoadDirective, MiddleclickDirective];
const components = [UploadDialogComponent];
const publicComponents = [CkeditorRenderComponent, SearchMemberComponent, EditorComponent];

@NgModule({
  declarations: [directives, components, publicComponents],
  imports: [CommonModule, SharedCommonModule, SharedUiMaterialModule, CKEditorModule],
  exports: [directives, publicComponents]
})
export class SharedModule {}
