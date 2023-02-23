import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ConversationGroup,
  HistoryMessageService,
  SendWhatsAppRequest,
  Template,
  TemplateMessageQuery,
  WhatsAppMessage,
  WhatsAppTemplate
} from '@b3networks/api/workspace';
import { Observable } from 'rxjs';

@Component({
  selector: 'b3n-whatsapp-template',
  templateUrl: './whatsapp-template.component.html',
  styleUrls: ['./whatsapp-template.component.scss']
})
export class WhatsappTemplate implements OnInit {
  templates$: Observable<Template[]>;
  selected: Template;

  processing: boolean;

  constructor(
    private templateMessageQuery: TemplateMessageQuery,
    private messageService: HistoryMessageService,
    public dialogRef: MatDialogRef<WhatsappTemplate>,
    @Inject(MAT_DIALOG_DATA) public convo: ConversationGroup
  ) {}

  ngOnInit() {
    this.templates$ = this.templateMessageQuery.templates$;
  }

  submit() {
    if (this.selected?.id) {
      const waTemplate = new WhatsAppTemplate();
      waTemplate.name = this.selected.id;
      const waMessage = new WhatsAppMessage();
      waMessage.template = waTemplate;
      const waReq = new SendWhatsAppRequest();
      waReq.convoUuid = this.convo.id;
      waReq.clientTs = new Date().valueOf();
      waReq.message = waMessage;
      this.messageService.sendWhatsAppV2(waReq).subscribe();
      this.dialogRef.close();
    }
  }
}
