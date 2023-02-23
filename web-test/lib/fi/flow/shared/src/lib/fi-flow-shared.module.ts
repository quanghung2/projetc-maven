import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { QuillModule } from 'ngx-quill';
import { DeleteFlowDialogComponent } from './delete-flow-dialog/delete-flow-dialog.component';
import { DependentInputComponent } from './dependent-input/dependent-input.component';
import { FormatObjToJsonDirective } from './directives/format-obj-to-json.directive';
import { ResizableDirective } from './directives/resizable.directive';
import { RegexPatternComponent } from './regex-pattern/regex-pattern.component';
import { RenameFlowDialogComponent } from './rename-flow-dialog/rename-flow-dialog.component';
import { ContextMenuComponent } from './value-of-parameter/context-menu/context-menu.component';
import { ValueOfParameterComponent } from './value-of-parameter/value-of-parameter.component';
import { ValueTypeDatasourceComponent } from './value-of-parameter/value-type-datasource/value-type-datasource.component';
import { ValueTypeOthersComponent } from './value-of-parameter/value-type-others/value-type-others.component';
import { ValueTypeStringComponent } from './value-of-parameter/value-type-string/value-type-string.component';

const MODULES = [CommonModule, SharedCommonModule, SharedUiMaterialModule, QuillModule.forRoot()];
const COMPONENTS = [
  RenameFlowDialogComponent,
  DeleteFlowDialogComponent,
  ValueOfParameterComponent,
  ValueTypeStringComponent,
  ValueTypeDatasourceComponent,
  ValueTypeOthersComponent,
  ContextMenuComponent,
  DependentInputComponent,
  RegexPatternComponent
];
const DIRECTIVES = [ResizableDirective, FormatObjToJsonDirective];

@NgModule({
  declarations: [COMPONENTS, DIRECTIVES],
  imports: [MODULES],
  exports: [MODULES, COMPONENTS, DIRECTIVES]
})
export class FiFlowSharedModule {}
