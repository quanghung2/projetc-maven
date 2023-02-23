import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TimerCall } from '@b3networks/api/call';
import { S3Service, ScaningStatus, Status, TempUploadRes } from '@b3networks/api/file';
import {
  ChannelType,
  ChatService,
  ConvoType,
  GroupType,
  HistoryMessageService,
  MAX_FILE_SIZE,
  MediaService,
  RequestCreateMedia,
  SendWhatsAppRequest,
  UserType,
  WhatsAppMessage
} from '@b3networks/api/workspace';
import { fileImage, getFileExtension, humanFileSize } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { getFileType } from '../../core/helper/helper';
import { UploadDialogInput } from '../upload-dialog/upload-dialog.component';

@Component({
  selector: 'b3n-upload-dialog-v2',
  templateUrl: './upload-dialog-v2.component.html',
  styleUrls: ['./upload-dialog-v2.component.scss']
})
export class UploadDialogV2Component {
  uploadPercentage: number;
  uploading: boolean;

  sizeFile: string;
  logoFileType: string;
  isLargeFile: boolean;
  isImage: boolean;
  infoImage: {
    loaded: boolean;
    width?: number;
    height?: number;
    src?: string;
  } = {
    loaded: false
  };

  constructor(
    private dialogRef: MatDialogRef<UploadDialogV2Component>,
    @Inject(MAT_DIALOG_DATA) public data: UploadDialogInput,
    private toastService: ToastService,
    private chatService: ChatService,
    private messageService: HistoryMessageService,
    private s3Service: S3Service,
    private mediaService: MediaService
  ) {
    const size = humanFileSize(this.data.file?.size);
    this.sizeFile = size === 'NaN undefined' ? null : size;
    this.logoFileType = getFileType(getFileExtension(data.file.name));
    this.isLargeFile = this.data.file.size > MAX_FILE_SIZE;

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
    this.uploading = true;
    this.s3Service.tempUploadWithAVScan(this.data.file).subscribe(
      res => {
        if (res.status === Status.PROCESSING) {
          this.uploadPercentage = res.percentage;
        }
        if (res.status === Status.COMPLETED) {
          const timer = new TimerCall();
          timer.countTimeCall();
          this.avScanProgress(res?.scanId, res, timer);
        }
      },
      error => {
        this.toastService.error(error.message || 'The file could not be uploaded. Please try again in a few minutes');
        this.uploading = false;
      }
    );
  }

  private avScanProgress(scanId: number, res: TempUploadRes, timer: TimerCall) {
    this.s3Service.scaningFileStatus(scanId).subscribe(
      status => {
        console.log(`AV Scan ${scanId}: ${status}`);
        if (status === ScaningStatus.scanning) {
          if (timer.second >= 60) {
            // timeout 1m
            timer.clearIntervalTime();
            this.toastService.error('High traffic. Please try again later.');
            return;
          }
          setTimeout(() => {
            this.avScanProgress(scanId, res, timer);
          }, 1000);
        } else if (status === ScaningStatus.failed) {
          timer.clearIntervalTime();
          this.toastService.error('High traffic. Please try again later.');
        } else if (status === ScaningStatus.infected) {
          timer.clearIntervalTime();
          this.toastService.error('Warning! The upload file has been infected.');
        } else if (status === ScaningStatus.clean) {
          timer.clearIntervalTime();
          this.uploadFileForChannel(res);
        }
      },
      error => {
        this.toastService.error(error.message || 'The file could not be uploaded. Please try again in a few minutes');
        this.uploading = false;
      }
    );
  }

  private uploadFileForChannel(res: TempUploadRes) {
    const fileType = getFileExtension(this.data.file.name);
    let conversationGroupId = this.data.channelHyperspace
      ? this.data.channelHyperspace.id
      : this.data.channel
      ? this.data.channel.id
      : this.data.ticket.conversationGroupId;

    // TODO: livechat with Customer type
    const userType = this.data.isPublic
      ? UserType.Customer
      : this.data.ticket &&
        (this.data.ticket.type === GroupType.Customer ||
          this.data.ticket.type === GroupType.WhatsApp ||
          this.data.ticket.type === GroupType.SMS ||
          this.data.ticket.type === GroupType.Email)
      ? UserType.Agent
      : UserType.TeamMember;

    let convoType: ConvoType;
    if (this.data?.ticket?.type === GroupType.WhatsApp) {
      convoType = ConvoType.whatsapp;
    } else if (this.data?.ticket?.type === GroupType.Customer) {
      convoType = ConvoType.customer;
    } else if (this.data?.ticket?.type === GroupType.Email) {
      convoType = ConvoType.email;
      conversationGroupId = this.data?.ticket?.publicConversationId;
    } else if (this.data?.channel) {
      if (this.data.channel.type === ChannelType.dm) {
        convoType = ConvoType.direct;
      } else {
        convoType = ConvoType.groupchat;
      }
    } else if (this.data?.channelHyperspace) {
      if (this.data.channelHyperspace.type === ChannelType.dm) {
        convoType = ConvoType.direct;
      } else {
        convoType = ConvoType.groupchat;
      }
    }

    const session = this.chatService.state?.session;
    const fileName = this.data.file.name;
    const tempKey = res.tempKey;

    if (this.data.channelHyperspace) {
      this.mediaService
        .createMediaFromStorage(<RequestCreateMedia>{
          convoId: conversationGroupId,
          convoType: convoType,
          namespace: session.ns,
          key: tempKey,
          filename: fileName,
          fileType: fileType,
          size: this.data.file.size,
          userId: session.chatUser || session.chatUserUuid,
          userType: userType,
          wssToken: session.token,
          chatServer: session.addr,
          metadata: {
            width: this.infoImage?.width,
            height: this.infoImage?.height
          },
          hyperspaceId: this.data.channelHyperspace?.hyperspaceId
        })
        .subscribe(
          _ => {
            this.dialogRef.close();
          },
          err => {
            this.toastService.error(err.message || 'The file could not be uploaded. Please try again in a few minutes');
            this.uploading = false;
          }
        );
    } else if (this.data.channel) {
      this.mediaService
        .createMediaFromStorage(<RequestCreateMedia>{
          convoId: conversationGroupId,
          convoType: convoType,
          namespace: session.ns,
          key: tempKey,
          filename: fileName,
          fileType: fileType,
          size: this.data.file.size,
          userId: session.chatUser || session.chatUserUuid,
          userType: userType,
          wssToken: session.token,
          chatServer: session.addr,
          metadata: {
            width: this.infoImage?.width,
            height: this.infoImage?.height
          }
        })
        .subscribe(
          _ => {
            if (this.data.channel) {
            } else if (this.data.ticket && this.data.ticket.type === GroupType.WhatsApp) {
            } else if (this.data.ticket && this.data.ticket.type === GroupType.Email) {
            } else if (this.data?.ticket?.type === GroupType.Customer) {
            }

            this.dialogRef.close();
          },
          err => {
            this.toastService.error(err.message || 'The file could not be uploaded. Please try again in a few minutes');
            this.uploading = false;
          }
        );
    } else if (this.data.ticket && this.data.ticket.type === GroupType.WhatsApp) {
      const waReq = new SendWhatsAppRequest();
      waReq.convoUuid = this.data.ticket.conversationGroupId;
      waReq.clientTs = new Date().valueOf();
      waReq.message = new WhatsAppMessage();
      waReq.message.media = <RequestCreateMedia>{
        convoId: conversationGroupId,
        convoType: convoType,
        namespace: session.ns,
        key: tempKey,
        filename: fileName,
        fileType: fileType,
        size: this.data.file.size,
        userId: session.chatUser || session.chatUserUuid,
        userType: userType,
        wssToken: session.token,
        chatServer: session.addr,
        metadata: {
          width: this.infoImage?.width,
          height: this.infoImage?.height
        }
      };
      this.messageService.sendWhatsAppV2(waReq).subscribe(__ => {
        this.dialogRef.close();
      });
    } else if (this.data.ticket && this.data.ticket.type === GroupType.Email) {
    } else if (this.data?.ticket?.type === GroupType.Customer) {
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
