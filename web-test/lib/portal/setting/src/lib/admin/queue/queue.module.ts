import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { CommsCallcenterSharedModule } from '@b3networks/comms/callcenter/shared';
import { FiFlowFeatureBusinessActionModule } from '@b3networks/fi/flow/feature/business-action';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiTextareaSMSModule } from '@b3networks/shared/ui/textarea-sms';
import { ActionEventsConfigComponent } from './action-events-config/action-events-config.component';
import { FlowConfigComponent } from './action-events-config/flow-config/flow-config.component';
import { GenieConfigComponent } from './action-events-config/genie-config/genie-config.component';
import { AgentManagementConfigComponent } from './agent-management-config/agent-management-config.component';
import { CallSurveyComponent } from './call-survey-config/call-survey-config.component';
import { TtsMp3MsgCfgComponent } from './common/tts-mp3-msg-cfg/tts-mp3-msg-cfg.component';
import { ConcurrentCallComponent } from './concurrent-call/concurrent-call.component';
import { CreateQueueComponent } from './create-queue/create-queue.component';
import { DeleteQueueComponent } from './delete-queue/delete-queue.component';
import { EditQueueComponent } from './edit-queue/edit-queue.component';
import { GeneralConfigComponent } from './general-config/general-config.component';
import { MohConfigComponent } from './moh-config/moh-config.component';
import { NoteConfigComponent } from './note-config/note-config.component';
import { ShareNoteTemplateModule } from './note-config/store-note-template/share-note-template.module';
import { CustomFieldComponent } from './note-configuration/custom-field/custom-field.component';
import { CustomFieldPipe } from './note-configuration/custom-field/custom-field.pipe';
import { FormCustomFieldComponent } from './note-configuration/form-custom-field/form-custom-field.component';
import { NoteConfigurationComponent } from './note-configuration/note-configuration.component';
import { QueueListComponent } from './queue-list.component';
import { VoicemailCallbackComponent } from './voicemail-callback/voicemail-callback.component';
import { VoicemailDetailComponent } from './voicemail-callback/voicemail-detail/voicemail-detail.component';
import { MessageConfigComponent } from './message-config/message-config.component';

const routes: Route[] = [{ path: '', component: QueueListComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedUiMaterialModule,
    SharedUiTextareaSMSModule,
    CommsCallcenterSharedModule,
    FiFlowFeatureBusinessActionModule,
    ShareNoteTemplateModule
  ],
  exports: [ConcurrentCallComponent],
  declarations: [
    QueueListComponent,
    CreateQueueComponent,
    DeleteQueueComponent,
    MohConfigComponent,
    VoicemailCallbackComponent,
    TtsMp3MsgCfgComponent,
    EditQueueComponent,
    ActionEventsConfigComponent,
    AgentManagementConfigComponent,
    FlowConfigComponent,
    CallSurveyComponent,
    GenieConfigComponent,
    VoicemailDetailComponent,
    CustomFieldComponent,
    CustomFieldPipe,
    FormCustomFieldComponent,
    NoteConfigurationComponent,
    ConcurrentCallComponent,
    GeneralConfigComponent,
    NoteConfigComponent,
    MessageConfigComponent
  ]
})
export class QueueModule {}
