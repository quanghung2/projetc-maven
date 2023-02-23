import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CannedResponse, HistoryMessageService, SendWhatsAppRequest, WhatsAppMessage } from '@b3networks/api/workspace';
import { SupportedConvo } from '../../core/adapter/convo-helper.service';

@Component({
  selector: 'app-whatsapp-canned-response',
  templateUrl: './whatsapp-canned-response.component.html',
  styleUrls: ['./whatsapp-canned-response.component.scss']
})
export class WhatsappCannedResponseComponent {
  processing: boolean;

  constructor(
    private messageService: HistoryMessageService,
    public dialogRef: MatDialogRef<WhatsappCannedResponseComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { convo: SupportedConvo; cannedResponse: CannedResponse }
  ) {}

  submit() {
    const waMessage = new WhatsAppMessage();
    waMessage.text = this.data.cannedResponse.content;
    const waReq = new SendWhatsAppRequest();
    waReq.convoUuid = this.data.convo.id;
    waReq.clientTs = new Date().valueOf();
    waReq.message = waMessage;
    this.messageService.sendWhatsAppV2(waReq).subscribe();

    this.dialogRef.close();
  }
}
