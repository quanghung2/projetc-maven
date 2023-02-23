import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CustomersQuery } from '@b3networks/api/callcenter';
import {
  AttachmentMessageData,
  ChatMessage,
  ChatService,
  MAX_FILE_SIZE,
  MediaConversationType,
  MessageBody,
  MsgType,
  S3Service,
  Uploader,
  UploadStatus
} from '@b3networks/api/workspace';
import { getFileType, MessageConstants, UploadDialogInput } from '@b3networks/chat/shared/core';
import { fileImage, getFileExtension, humanFileSize, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

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
    private toastService: ToastService,
    private s3Service: S3Service,
    private customersQuery: CustomersQuery,
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

  handleUploadFilePublic() {
    const fileType = getFileExtension(this.data.file.name);
    const conversationGroupId = this.data.channel ? this.data.channel.id : this.data.ticket.conversationGroupId;
    const uploader: Uploader = this.s3Service.upload(
      X.orgUuid,
      this.data.file,
      conversationGroupId,
      MediaConversationType.livechat,
      true
    );
    this.uploadPercentage = 0;

    if (uploader) {
      this.uploading = true;
      uploader.subscribe(
        uploadingProcess => {
          this.cdRef.markForCheck();
          this.uploadPercentage = uploadingProcess.percentage;
          if (uploadingProcess.status === UploadStatus.completed) {
            const responseUrl = `https://dl.b3.work/${uploader.fileResp.s3Key}`;

            this.s3Service.putMediaUuidPublic(uploader.fileResp.mediaUuid).subscribe(
              _ => {
                // public
                const chatCustomerId = this.customersQuery.getValue()?.chatCustomerId;
                const message = ChatMessage.createMessagePublic(
                  this.data.ticket,
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
                  chatCustomerId,
                  MsgType.attachment
                );
                this.chatService.send(message);

                this.dialogRef.close();
              },
              error => {
                this.toastService.error(MessageConstants.DEFAULT);
                this.dialogRef.close();
              }
            );
          }
        },
        error => {
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
