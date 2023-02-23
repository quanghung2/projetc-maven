import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommsCallcenterSharedModule } from '@b3networks/comms/callcenter/shared';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CallbackTxnComponent } from './callback-txn/callback-txn.component';
import { ContactCreateComponent } from './inbound-txn/contact-create/contact-create.component';
import { ContactDisplayComponent } from './inbound-txn/contact-display/contact-display.component';
import { DynamicInputPipe } from './inbound-txn/dynamic-input.pipe';
import { DynamicInputComponent } from './inbound-txn/dynamic-input/dynamic-input.component';
import { InboundTxnComponent } from './inbound-txn/inbound-txn.component';
import { ManualOutgoingTxnComponent } from './manual-outgoing-txn/manual-outgoing-txn.component';
import { OutboundTxnComponent } from './outbound-txn/outbound-txn.component';

@NgModule({
  declarations: [
    InboundTxnComponent,
    OutboundTxnComponent,
    CallbackTxnComponent,
    ManualOutgoingTxnComponent,
    ContactCreateComponent,
    ContactDisplayComponent,
    DynamicInputComponent,
    DynamicInputPipe
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CommsCallcenterSharedModule, SharedUiMaterialModule]
})
export class WorkspaceSharedModule {}
