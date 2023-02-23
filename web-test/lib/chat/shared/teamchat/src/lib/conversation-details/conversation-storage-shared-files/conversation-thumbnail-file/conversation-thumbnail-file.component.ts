import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FileService, RequestUploadData } from '@b3networks/api/file';
import { Channel, ChannelService, ChatService, FileDetail, MediaService } from '@b3networks/api/workspace';
import { AppQuery, AppService, getFileType, ModeSidebar } from '@b3networks/chat/shared/core';
import { download, downloadData, fileImage, getFileExtension, X } from '@b3networks/shared/common';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'b3n-conversation-thumbnail-file',
  templateUrl: './conversation-thumbnail-file.component.html',
  styleUrls: ['./conversation-thumbnail-file.component.scss']
})
export class ConversationThumbnailFileComponent implements OnInit {
  @Input() file: FileDetail;
  @Input() convo: Channel;

  src: string;
  isImgFile: boolean;
  logoFileType: string;

  constructor(
    private mediaService: MediaService,
    private fileService: FileService,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private appQuery: AppQuery,
    private appService: AppService,
    private channelService: ChannelService
  ) {}

  ngOnInit() {
    this.detectFile();
    if (this.isImgFile && this.file?.uri) {
      if (this.file.uri.startsWith('storage://')) {
        const keyWithOrgUuid = this.file.uri.replace('storage://', '');
        const session = this.chatService.state?.session;
        this.fileService
          .getThumbnailMediaStorageUuid(keyWithOrgUuid, <RequestUploadData>{
            chatUserId: session.chatUser,
            orgUuid: X.orgUuid,
            wssToken: session.token,
            chatServer: session.addr,
            convoType: this.convo.type
          })
          .subscribe(url => {
            this.src = url;
            this.cdr.detectChanges();
          });
      } else if (this.file.uri.startsWith('legacy://')) {
        const mediaUuid = this.file.uri.replace('legacy://', '');
        this.mediaService.getMediaImgThumbnail(mediaUuid, this.convo.id).subscribe(res => {
          this.src = res?.url;
          this.cdr.detectChanges();
        });
      } else if (this.file?.mediaId) {
        this.mediaService.getMediaImgThumbnail(this.file.mediaId, this.convo.id)?.subscribe(res => {
          this.src = res?.url;
          this.cdr.detectChanges();
        });
      }
    }
  }

  view() {
    if (this.file?.msgId) {
      const appQuery = this.appQuery.getValue();
      if (appQuery.modeRightSidebar === ModeSidebar.over && appQuery.showRightSidebar) {
        this.appService.update({
          showRightSidebar: false
        });

        setTimeout(() => {
          this.channelService.updateChannelViewState(this.convo.id, {
            jumpMessageId: this.file.msgId
          });
        }, 500);
        return;
      }
      this.channelService.updateChannelViewState(this.convo.id, {
        jumpMessageId: this.file.msgId
      });
      return;
    }

    if (this.isImgFile) {
      let originalImg$ = of<string>(null);
      let isRevokeUrl: boolean;
      if (this.file?.uri.startsWith('storage://')) {
        const keyWithOrgUuid = this.file.uri.replace('storage://', '');
        originalImg$ = this.fileService.downloadFileV3(keyWithOrgUuid).pipe(
          map(resp => {
            const file = new Blob([resp.body], { type: `${resp.body.type}` });
            isRevokeUrl = true;
            return URL.createObjectURL(file);
          })
        );
      } else if (this.file?.uri.startsWith('legacy://')) {
        const mediaUuid = this.file.uri.replace('legacy://', '');
        originalImg$ = this.mediaService.getMediaImgOriginal(mediaUuid, this.convo.id).pipe(map(resp => resp?.url));
      } else if (this.file?.mediaId) {
        originalImg$ = this.mediaService
          .getMediaImgOriginal(this.file.mediaId, this.convo.id)
          .pipe(map(resp => resp?.url));
      }
      originalImg$?.subscribe(url => {
        const image = new Image();
        image.src = url;
        const viewer = new Viewer(image, {
          hidden: () => {
            if (isRevokeUrl) {
              URL.revokeObjectURL(url);
            }
            viewer.destroy();
          },
          toolbar: {
            zoomIn: 4,
            zoomOut: 4,
            oneToOne: 4,
            reset: 4,
            rotateLeft: 4,
            rotateRight: 4,
            flipHorizontal: 4,
            flipVertical: 4
          }
        });
        viewer.show();
      });
    }
  }

  download($event) {
    $event.stopPropagation();

    if (this.file?.uri) {
      if (this.file.uri.startsWith('storage://')) {
        const keyWithOrgUuid = this.file.uri.replace('storage://', '');
        this.fileService.downloadFileV3(keyWithOrgUuid).subscribe(resp => {
          const file = new Blob([resp.body], { type: `${resp.body.type}` });
          downloadData(file, this.file.name);
        });
      } else if (this.file.uri.startsWith('legacy://')) {
        const mediaUuid = this.file.uri.replace('legacy://', '');
        this.mediaService.getMediaImgOriginal(mediaUuid, this.convo.id).subscribe(res => {
          download(res['url'], this.file.name);
        });
      }
    }
  }

  private detectFile() {
    const fileType = this.getFileType();

    if (!fileType) {
      return false;
    }

    this.isImgFile = fileImage.indexOf(fileType) > -1;
    this.logoFileType = getFileType(fileType);
    return true;
  }

  private getFileType() {
    let fileType;

    if (this.file.fileType) {
      fileType = this.file.fileType?.toLowerCase().split('/')?.pop();
    }

    if (!fileType) {
      fileType = getFileExtension(this.file?.name);
    }

    return fileType;
  }
}
