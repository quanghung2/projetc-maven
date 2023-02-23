import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { CommsCallcenterSharedModule } from '@b3networks/comms/callcenter/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiTextareaSMSModule } from '@b3networks/shared/ui/textarea-sms';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { ActionEventsConfigComponent } from './action-events-config/action-events-config.component';
import { FlowConfigComponent } from './action-events-config/flow-config/flow-config.component';
import { GenieConfigComponent } from './action-events-config/genie-config/genie-config.component';
import { AgentManagementConfigComponent } from './agent-management-config/agent-management-config.component';
import { AnnouncementConfigComponent } from './announcement-config/announcement-config.component';
import { CallSurveyComponent } from './call-survey-config/call-survey-config.component';
import { TtsMp3MsgCfgComponent } from './common/tts-mp3-msg-cfg/tts-mp3-msg-cfg.component';
import { ConcurrentCallComponent } from './concurrent-call/concurrent-call.component';
import { DialPlansConfigurationComponent } from './configuration/dial-plans-configuration/dial-plans-configuration.component';
import { CreateQueueComponent } from './create-queue/create-queue.component';
import { DeleteQueueComponent } from './delete-queue/delete-queue.component';
import { EditQueueComponent } from './edit-queue/edit-queue.component';
import { MohConfigComponent } from './moh-config/moh-config.component';
import { CustomFieldComponent } from './note-configuration/custom-field/custom-field.component';
import { CustomFieldPipe } from './note-configuration/custom-field/custom-field.pipe';
import { FormCustomFieldComponent } from './note-configuration/form-custom-field/form-custom-field.component';
import { NoteConfigurationComponent } from './note-configuration/note-configuration.component';
import { QueueListComponent } from './queue-list.component';
import { VoicemailCallbackComponent } from './voicemail-callback/voicemail-callback.component';
import { VoicemailDetailComponent } from './voicemail-callback/voicemail-detail/voicemail-detail.component';

const routes: Route[] = [{ path: '', component: QueueListComponent, children: [] }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    RouterModule.forChild(routes),

    SharedCommonModule,
    CommsCallcenterSharedModule,
    SharedUiToastModule,
    SharedUiTextareaSMSModule,
    SharedUiMaterialModule
  ],
  exports: [ConcurrentCallComponent],
  declarations: [
    QueueListComponent,
    CreateQueueComponent,
    DeleteQueueComponent,
    MohConfigComponent,
    AnnouncementConfigComponent,
    VoicemailCallbackComponent,
    TtsMp3MsgCfgComponent,
    EditQueueComponent,
    ActionEventsConfigComponent,
    AgentManagementConfigComponent,
    DialPlansConfigurationComponent,
    FlowConfigComponent,
    CallSurveyComponent,
    GenieConfigComponent,
    VoicemailDetailComponent,
    CustomFieldComponent,
    CustomFieldPipe,
    FormCustomFieldComponent,
    NoteConfigurationComponent,
    ConcurrentCallComponent
  ]
})
export class QueueModule {
  constructor() {}
}
