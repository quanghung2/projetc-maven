import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedCommonModule } from '@b3networks/shared/common';
import { DeleteActionComponent } from './delete-action/delete-action.component';
import { DeleteItemDialogComponent } from './delete-item-dialog/delete-item-dialog.component';
import { MemberBoxComponent } from './member-box/member-box.component';
import { AgentAvatarComponent } from './agent-avatar/agent-avatar.component';
import { ColorMenuComponent } from './color-menu/color-menu.component';

const Components = [
  ColorMenuComponent,
  DeleteActionComponent,
  DeleteItemDialogComponent,
  MemberBoxComponent,
  AgentAvatarComponent
];
@NgModule({
  declarations: [Components],
  exports: [Components],
  imports: [CommonModule, SharedUiMaterialModule, SharedCommonModule]
})
export class SharedModule {}
