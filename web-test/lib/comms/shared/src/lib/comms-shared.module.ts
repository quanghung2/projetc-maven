import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CallDurationComponent } from './component/call-duration/call-duration.component';
import { TtsConfigComponent } from './component/tts-config/tts-config.component';
import { IncomingActionPipe } from './pipe/incoming-action.pipe';
import { RemarksDialogComponent } from './component/remarks/remarks-dialog.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

const PIPE = [IncomingActionPipe];

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedUiMaterialModule, SharedCommonModule, DragDropModule],
  declarations: [TtsConfigComponent, PIPE, CallDurationComponent, RemarksDialogComponent],
  exports: [TtsConfigComponent, PIPE, CallDurationComponent, RemarksDialogComponent]
})
export class CommsSharedModule {}
