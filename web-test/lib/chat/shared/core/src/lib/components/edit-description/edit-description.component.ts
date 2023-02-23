import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Channel,
  ChannelHyperspace,
  ChannelHyperspaceService,
  ChannelService,
  ChatMessage,
  ChatService,
  ConversationGroup,
  ConversationGroupService,
  MeQuery,
  MessageBody,
  MsgType,
  ReqUpdateMetaDataHyper,
  UpdateChannelReq,
  User
} from '@b3networks/api/workspace';
import { finalize } from 'rxjs/operators';
import { SupportedConvo } from '../../core/adapter/convo-helper.service';
import { MessageConstants } from '../../core/constant/message.const';

@Component({
  selector: 'csh-edit-description',
  templateUrl: './edit-description.component.html',
  styleUrls: ['./edit-description.component.scss']
})
export class EditDescriptionComponent implements OnInit {
  me: User;
  desc: string;

  processing: boolean;

  constructor(
    private meQuery: MeQuery,
    private chatService: ChatService,
    private convoGroupService: ConversationGroupService,
    private channelHyperspaceService: ChannelHyperspaceService,
    private channelService: ChannelService,
    @Inject(MAT_DIALOG_DATA) public convo: SupportedConvo,
    private dialogRef: MatDialogRef<EditDescriptionComponent>
  ) {}

  ngOnInit() {
    this.desc = this.convo.description;
    this.me = this.meQuery.getMe();
  }

  submit() {
    this.processing = true;
    if (this.convo instanceof ConversationGroup) {
      this.convoGroupService
        .updateDescription(this.convo.id, this.desc)
        .pipe(finalize(() => (this.processing = false)))
        .subscribe(_ => {
          const message = ChatMessage.createMessage(
            this.convo,
            new MessageBody({
              text: MessageConstants.EDIT_MESSAGE(this.me, this.desc)
            }),
            this.me.userUuid,
            MsgType.system
          );

          this.chatService.send(message);

          this.dialogRef.close();
        });
    } else if (this.convo instanceof Channel) {
      const req = <UpdateChannelReq>{
        description: this.desc
      };

      this.channelService
        .updateNameOrDescriptionChannel(this.convo.id, req)
        .pipe(finalize(() => (this.processing = false)))
        .subscribe(_ => this.dialogRef.close());
    } else if (this.convo instanceof ChannelHyperspace) {
      const req = <ReqUpdateMetaDataHyper>{
        hyperspaceId: this.convo.hyperspaceId,
        hyperchannelId: this.convo.id,
        description: this.desc
      };

      this.channelHyperspaceService
        .updateChannelHyper(req)
        .pipe(finalize(() => (this.processing = false)))
        .subscribe(_ => this.dialogRef.close());
    }
  }
}
