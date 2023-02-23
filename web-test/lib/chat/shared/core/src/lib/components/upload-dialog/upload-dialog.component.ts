import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CustomersQuery } from '@b3networks/api/callcenter';
import {
  AttachmentMessageData,
  ChannelHyperspace,
  ChatMessage,
  ChatService,
  ConversationGroup,
  GroupType,
  HistoryMessageService,
  MAX_FILE_SIZE,
  MediaConversationType,
  MeQuery,
  MessageBody,
  MsgType,
  S3Service,
  SendWhatsAppRequest,
  Uploader,
  UploadStatus,
  WhatsAppMessage
} from '@b3networks/api/workspace';
import { fileImage, getFileExtension, humanFileSize, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MessageConstants } from '../../core/constant/message.const';
import { getFileType } from '../../core/helper/helper';
import { SupportedConvo } from './../../core/adapter/convo-helper.service';

export interface UploadDialogInput {
  channel?: SupportedConvo;
  ticket?: ConversationGroup; // for whatsapp, email
  channelHyperspace?: ChannelHyperspace; // for whatsapp, email
  file: File;
  index: number;
  max: number;
  isNoStore?: boolean;
  isPublic?: boolean;
}

@Component({
  selector: 'b3n-upload-dialog',
  templateUrl: './upload-dialog.component.html',
  styleUrls: ['./upload-dialog.component.scss']
})
export class UploadDialogComponent {
  readonly humanFileSize = humanFileSize;
  readonly getFileType = getFileType;
  readonly getFileExtension = getFileExtension;

  uploading: boolean;
  uploadPercentage = 0;

  isImage: boolean;
  infoImage: {
    loaded: boolean;
    width?: number;
    height?: number;
    src?: string;
  } = {
    loaded: false
  };

  get isLargeFile() {
    return this.data.file.size > MAX_FILE_SIZE;
  }

  constructor(
    private dialogRef: MatDialogRef<UploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UploadDialogInput,
    private chatService: ChatService,
    private messageService: HistoryMessageService,
    private toastService: ToastService,
    private s3Service: S3Service,
    private customersQuery: CustomersQuery,
    private meQuery: MeQuery,
    private cdRef: ChangeDetectorRef
  ) {
    this.isImage = this.isImageFile();
    if (this.isImage) {
      const reader = new FileReader();
      reader.onload = _event => {
        const image = new Image();
        image.src = _event.target.result.toString();
        image.onload = () => {
          this.infoImage = {
            ...this.infoImage,
            src: reader.result as string,
            width: image.width,
            height: image.height,
            loaded: true
          };
        };
      };
      reader.readAsDataURL(this.data.file);
    }
  }

  handleUploadFile() {
    const fileType = getFileExtension(this.data.file.name);
    const conversationGroupId = this.data.channelHyperspace
      ? this.data.channelHyperspace.id
      : this.data.channel
      ? this.data.channel.id
      : this.data.ticket.conversationGroupId;
    let mediaConvoType: MediaConversationType;
    if (this.data?.ticket?.type === GroupType.WhatsApp) {
      mediaConvoType = MediaConversationType.whatsapp;
    } else if (this.data?.ticket?.type === GroupType.Customer) {
      mediaConvoType = MediaConversationType.livechat;
    } else if (this.data?.ticket?.type === GroupType.Email) {
      mediaConvoType = MediaConversationType.email;
    } else {
      mediaConvoType = MediaConversationType.team;
    }
    const uploader: Uploader = this.s3Service.upload(X.orgUuid, this.data.file, conversationGroupId, mediaConvoType);
    this.uploadPercentage = 0;

    if (uploader) {
      this.uploading = true;
      uploader.subscribe(
        uploadingProcess => {
          this.cdRef.markForCheck();
          this.uploadPercentage = uploadingProcess.percentage;
          if (uploadingProcess.status === UploadStatus.completed) {
            const responseUrl = `https://dl.b3.work/${uploader.fileResp.s3Key}`;

            this.s3Service.putMediaUuid(uploader.fileResp.mediaUuid).subscribe(
              _ => {
                const me = this.meQuery.getMe();
                if (this.data.channel) {
                  const message = ChatMessage.createMessage(
                    this.data.channel,
                    new MessageBody({
                      text: this.data.file.name,
                      data: new AttachmentMessageData({
                        name: this.data.file.name,
                        uri: responseUrl,
                        fileType: fileType,
                        size: this.data.file.size,
                        width: this.infoImage?.width,
                        height: this.infoImage?.height,
                        fileUuid: uploader.fileResp.mediaUuid,
                        s3Key: uploader.fileResp.s3Key,
                        mediaUuid: uploader.fileResp.mediaUuid
                      })
                    }),
                    me.userUuid,
                    MsgType.attachment
                  );
                  this.chatService.send(message);
                  this.dialogRef.close();
                } else if (this.data.ticket && this.data.ticket.type === GroupType.WhatsApp) {
                  const waMessage = new WhatsAppMessage();
                  waMessage.mediaUuid = uploader.fileResp.mediaUuid;
                  const waReq = new SendWhatsAppRequest();
                  waReq.convoUuid = this.data.ticket.conversationGroupId;
                  waReq.clientTs = new Date().valueOf();
                  waReq.message = waMessage;
                  this.messageService.sendWhatsAppV2(waReq).subscribe(__ => {
                    const message = ChatMessage.createMessage(
                      this.data.ticket,
                      new MessageBody({
                        data: new AttachmentMessageData({
                          name: this.data.file.name,
                          uri: responseUrl,
                          fileType: fileType,
                          size: this.data.file.size,
                          width: this.infoImage.width,
                          height: this.infoImage.height,
                          fileUuid: uploader.fileResp.mediaUuid,
                          s3Key: uploader.fileResp.s3Key,
                          mediaUuid: uploader.fileResp.mediaUuid
                        })
                      }),
                      me.userUuid,
                      MsgType.attachment
                    );
                    this.chatService.send(message);
                    this.dialogRef.close();
                  });
                } else if (this.data.ticket && this.data.ticket.type === GroupType.Email) {
                  const fileName = this.data.file.name;
                  const messageBody = new MessageBody({
                    text: fileName,
                    data: new AttachmentMessageData({
                      name: fileName,
                      uri: responseUrl,
                      fileType: fileType,
                      size: this.data.file.size,
                      width: this.infoImage.width,
                      height: this.infoImage.height,
                      fileUuid: uploader.fileResp.mediaUuid,
                      s3Key: uploader.fileResp.s3Key,
                      mediaUuid: uploader.fileResp.mediaUuid
                    })
                  });
                  if (this.data.isNoStore) {
                    this.dialogRef.close(messageBody.data);
                  } else {
                    const message = ChatMessage.createEmailMessage(
                      this.data.ticket,
                      messageBody,
                      me.userUuid,
                      MsgType.attachment
                    );
                    this.chatService.send(message);
                    this.dialogRef.close(messageBody.data);
                  }
                } else if (this.data?.ticket?.type === GroupType.Customer) {
                  const message = ChatMessage.createMessage(
                    this.data.ticket,
                    new MessageBody({
                      text: this.data.file.name,
                      data: new AttachmentMessageData({
                        name: this.data.file.name,
                        uri: responseUrl,
                        fileType: fileType,
                        size: this.data.file.size,
                        width: this.infoImage.width,
                        height: this.infoImage.height,
                        fileUuid: uploader.fileResp.mediaUuid,
                        s3Key: uploader.fileResp.s3Key,
                        mediaUuid: uploader.fileResp.mediaUuid
                      })
                    }),
                    me.userUuid,
                    MsgType.attachment
                  );
                  this.chatService.send(message);
                  this.dialogRef.close();
                }
              },
              () => {
                this.toastService.error(MessageConstants.DEFAULT);
                this.dialogRef.close();
              }
            );
          }
        },
        () => {
          this.uploading = false;
          this.dialogRef.close();
        }
      );
    }
  }

  private isImageFile() {
    let fileType;
    if (this.data.file?.type) {
      fileType = this.data.file.type?.toLowerCase().split('/')?.pop();
    }
    if (!fileType) {
      fileType = getFileExtension(this.data.file.name);
    }
    return fileImage.indexOf(fileType) > -1;
  }
}
