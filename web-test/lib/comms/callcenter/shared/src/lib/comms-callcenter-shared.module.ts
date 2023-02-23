import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { ActiveCallComponent } from './component/active-call/active-call.component';
import { ViewCallComponent } from './component/active-call/view-call/view-call.component';
import { ActionBarComponent } from './component/agent-list/action-bar/action-bar.component';
import { AgentListComponent } from './component/agent-list/agent-list.component';
import { AssignQueuesComponent } from './component/agent-list/assign-queues/assign-queues.component';
import { BusyNoteComponent } from './component/busy-note/busy-note.component';
import { CallLogBarComponent } from './component/call-log/action-bar/action-bar.component';
import { CallDetailComponent } from './component/call-log/call-detail/call-detail.component';
import { CallLogComponent } from './component/call-log/call-log.component';
import { UpdateNoteComponent } from './component/call-log/update-note/update-note.component';
import { DisplayCustomFieldComponent } from './component/display-custom-field/display-custom-field.component';
import { NumberPatternDirective } from './directives/number-patterm.directive';
import { NumberActionPipe, NumberStatusPipe } from './pipes';

const COMPONENT_PUBLIC = [
  AgentListComponent,
  CallLogComponent,
  ActiveCallComponent,
  ActionBarComponent,
  AssignQueuesComponent,
  ViewCallComponent,
  CallDetailComponent,
  CallLogBarComponent,
  UpdateNoteComponent,
  DisplayCustomFieldComponent,
  BusyNoteComponent,
  NumberPatternDirective,
  NumberActionPipe,
  NumberStatusPipe
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedCommonModule,
    SharedUiToastModule,
    FlexLayoutModule,
    SharedUiMaterialModule,
    SharedAuthModule
  ],
  declarations: [COMPONENT_PUBLIC],
  exports: [COMPONENT_PUBLIC]
})
export class CommsCallcenterSharedModule {}
