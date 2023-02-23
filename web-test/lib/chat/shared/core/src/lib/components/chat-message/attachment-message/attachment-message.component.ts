import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CacheMediaQuery } from '@b3networks/api/common';
import { FileService, RequestUploadData } from '@b3networks/api/file';
import {
  AttachmentMessageData,
  AttachmentMessageDataV2,
  ChatMessage,
  ChatService,
  MediaService,
  StatusMessage
} from '@b3networks/api/workspace';
import {
  download,
  downloadData,
  fileAudio,
  fileImage,
  fileVideo,
  getFileExtension,
  humanFileSize,
  X
} from '@b3networks/shared/common';
import { Observable, of } from 'rxjs';
import { filter, finalize, map, take } from 'rxjs/operators';
import Viewer from 'viewerjs';
import { getFileType } from '../../../core/helper/helper';

@Component({
  selector: 'csh-attachment-message',
  templateUrl: './attachment-message.component.html',
  styleUrls: ['./attachment-message.component.scss']
})
export class AttachmentMessageComponent implements OnInit, OnChanges {
  @Input() message: ChatMessage;
  @Input() parentElr: HTMLElement;
  @Input() isHideAction: boolean;
  @Input() isMobile: boolean;
  @Input() isPublic: boolean;

  loaded: boolean;
  isHiding: boolean;
  isLoading = true;
  isZooming: boolean;
  isImgFile: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isFailed: boolean;
  noIntersectionObserver: boolean;

  backgroundImage: string;
  sizeFile: string;
  fileType: string;
  logoFileType: string;
  style: any;
  attachmentData: AttachmentMessageData;

  private _defaultImageSize = 300;

  constructor(
    public mediaService: MediaService,
    private cacheMediaQuery: CacheMediaQuery,
    private fileService: FileService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.attachmentData = this.message.body.data?.attachment || this.message.body.data;
    this.style = this.customStyleMessage();

    this.isImgFile = this.isImageFile();
    this.isVideo = this.isVideoFile();
    this.isAudio = this.isAudioFile();
    if (this.isImgFile) {
      const isStorage = !!this.attachmentData?.uri && this.attachmentData.uri.startsWith('storage://');

      let url = null,
        keyWithOrgUuid: string;
      if (isStorage) {
        keyWithOrgUuid = this.attachmentData.uri.replace('storage://', '');
        url = this.cacheMediaQuery.getMediaByKey(keyWithOrgUuid, true)?.url;
      } else {
        keyWithOrgUuid = this.attachmentData.mediaUuid ? this.attachmentData.mediaUuid : this.attachmentData.fileUuid;
        url = this.cacheMediaQuery.getMediaByKey(keyWithOrgUuid, false)?.url;
      }
      this.noIntersectionObserver = !!url;
      this.isLoading = !this.noIntersectionObserver;
      this.backgroundImage = url ? `url('${url}')` : null;
    }

    const size = humanFileSize(this.attachmentData.size);
    this.sizeFile = size === 'NaN undefined' ? null : size;
    this.logoFileType = getFileType(this.getFileType());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message']) {
      this.isFailed = (<AttachmentMessageDataV2>this.message.body.data)?.waSentStatus?.status === StatusMessage.failed;
    }
  }

  onRenderImg() {
    const convoUuid = this.message.convo;
    const isStorage = !!this.attachmentData?.uri && this.attachmentData.uri.startsWith('storage://');

    if (isStorage) {
      const keyWithOrgUuid = this.attachmentData.uri.replace('storage://', '');
      this.chatService.session$
        .pipe(
          filter(x => x != null),
          take(1)
        )
        .subscribe(session => {
          this.fileService
            .getThumbnailMediaStorageUuid(keyWithOrgUuid, <RequestUploadData>{
              chatUserId: session.chatUser,
              orgUuid: this.message?.hs ? this.message?.ns : X.orgUuid,
              wssToken: session.token,
              chatServer: session.addr,
              convoType: this.message.ct,
              hyperspaceId: this.message?.hs,
              mediaOrgUuid: this.message?.ns
            })
            .pipe(
              finalize(() => {
                this.loaded = true;
                this.isLoading = false;
              })
            )
            .subscribe(url => {
              if (url) {
                this.backgroundImage = `url('${url}')`;
              }
            });
        });
    } else {
      const mediaUuid = this.attachmentData.mediaUuid ? this.attachmentData.mediaUuid : this.attachmentData.fileUuid;
      if (mediaUuid) {
        let api$;
        if (this.isPublic) {
          api$ = this.mediaService.getMediaImgThumbnailPublic(mediaUuid, convoUuid);
        } else {
          api$ = this.mediaService.getMediaImgThumbnail(mediaUuid, convoUuid);
        }
        api$
          ?.pipe(
            finalize(() => {
              this.loaded = true;
              this.isLoading = false;
            })
          )
          ?.subscribe(res => {
            if (res?.url) {
              this.backgroundImage = `url('${res?.url}')`;
            }
          });
      }
    }
  }

  download() {
    if (this.attachmentData) {
      this.mediaService.loadingMap[this.message.id] = true;
      if (!!this.attachmentData?.uri && this.attachmentData.uri.startsWith('storage://')) {
        const keyWithOrgUuid = this.attachmentData.uri.replace('storage://', '');
        if (this.message.hs) {
          this.chatService.session$
            .pipe(
              filter(x => x != null),
              take(1),
              finalize(() => (this.mediaService.loadingMap[this.message.id] = false))
            )
            .subscribe(session => {
              this.fileService
                .downloadFileV3Public(keyWithOrgUuid, <RequestUploadData>{
                  chatUserId: session.chatUser,
                  orgUuid: this.message?.hs ? this.message?.ns : X.orgUuid,
                  wssToken: session.token,
                  chatServer: session.addr,
                  convoType: this.message.ct,
                  hyperspaceId: this.message?.hs,
                  mediaOrgUuid: this.message?.ns
                })
                .subscribe(resp => {
                  const file = new Blob([resp.body], { type: `${resp.body.type}` });
                  downloadData(file, this.attachmentData.name);
                });
            });
        } else {
          this.fileService
            .downloadFileV3(keyWithOrgUuid)
            .pipe(finalize(() => (this.mediaService.loadingMap[this.message.id] = false)))
            .subscribe(resp => {
              const file = new Blob([resp.body], { type: `${resp.body.type}` });
              downloadData(file, this.attachmentData.name);
            });
        }
      } else {
        const mediaUuid = this.attachmentData.mediaUuid ? this.attachmentData.mediaUuid : this.attachmentData.fileUuid;
        if (mediaUuid) {
          if (this.isPublic) {
            this.mediaService
              .getMediaImgOriginalPublic(mediaUuid, this.message.convo)
              .pipe(finalize(() => (this.mediaService.loadingMap[this.message.id] = false)))
              .subscribe(res => {
                download(res['url'], this.attachmentData.name);
              });
          } else {
            this.mediaService
              .getMediaImgOriginal(mediaUuid, this.message.convo)
              .pipe(finalize(() => (this.mediaService.loadingMap[this.message.id] = false)))
              .subscribe(res => {
                download(res['url'], this.attachmentData.name);
              });
          }
        }
      }
    }
  }

  hide() {
    const el = document.getElementById('img-' + this.message.clientId);
    if (el) {
      el.style.filter = this.isHiding ? 'unset' : 'blur(20px)';
      el.style.pointerEvents = this.isHiding ? 'unset' : 'none';
      this.isHiding = !this.isHiding;
    }
  }

  zoom() {
    if (this.isZooming) {
      return;
    }

    this.isZooming = true;
    let originalImg$: Observable<string> = of(null);

    this.mediaService.loadingMap[this.message.id] = true;
    if (!!this.attachmentData?.uri && this.attachmentData.uri.startsWith('storage://')) {
      const keyWithOrgUuid = this.attachmentData.uri.replace('storage://', '');

      if (this.message.hs) {
        const session = this.chatService.session;
        originalImg$ = this.fileService
          .downloadFileV3Public(keyWithOrgUuid, <RequestUploadData>{
            chatUserId: session.chatUser,
            orgUuid: this.message?.hs ? this.message?.ns : X.orgUuid,
            wssToken: session.token,
            chatServer: session.addr,
            convoType: this.message.ct,
            hyperspaceId: this.message?.hs,
            mediaOrgUuid: this.message?.ns
          })
          .pipe(
            map(resp => {
              const file = new Blob([resp.body], { type: `${resp.body.type}` });
              return URL.createObjectURL(file);
            })
          );
      } else {
        originalImg$ = this.fileService.downloadFileV3(keyWithOrgUuid).pipe(
          map(resp => {
            const file = new Blob([resp.body], { type: `${resp.body.type}` });
            return URL.createObjectURL(file);
          })
        );
      }
    } else {
      const mediaUuid = this.attachmentData.mediaUuid ? this.attachmentData.mediaUuid : this.attachmentData.fileUuid;

      if (this.isPublic) {
        originalImg$ = this.mediaService
          .getMediaImgOriginalPublic(mediaUuid, this.message.convo)
          .pipe(map(resp => resp?.url));
      } else {
        originalImg$ = this.mediaService
          .getMediaImgOriginal(mediaUuid, this.message.convo)
          .pipe(map(resp => resp?.url));
      }
    }

    originalImg$?.pipe(finalize(() => (this.mediaService.loadingMap[this.message.id] = false))).subscribe(
      url => {
        if (!url) {
          return;
        }

        if (this.isPublic) {
          this.isZooming = false;
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.target = '_blank';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          return;
        }

        const image = new Image();
        image.src = url;
        const viewer = new Viewer(image, {
          hidden: () => {
            this.mediaService.loadingMap[this.message.id] = false;
            this.isZooming = false;
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
      },
      err => (this.isZooming = false)
    );
  }

  private isImageFile() {
    const fileType = this.getFileType();

    if (!fileType) {
      return false;
    }

    this.fileType = fileType;
    return fileImage.indexOf(fileType) > -1;
  }

  private isVideoFile() {
    const fileType = this.getFileType();

    if (!fileType) {
      return false;
    }

    this.fileType = fileType;
    return fileVideo.indexOf(fileType) > -1;
  }

  private isAudioFile() {
    const fileType = this.getFileType();

    if (!fileType) {
      return false;
    }

    this.fileType = fileType;
    return fileAudio.indexOf(fileType) > -1;
  }

  private getFileType() {
    let fileType;

    if (this.attachmentData.fileType) {
      fileType = this.attachmentData.fileType?.toLowerCase().split('/')?.pop();
    }

    if (!fileType) {
      fileType = getFileExtension(this.attachmentData?.name);
    }

    return fileType;
  }

  private customStyleMessage() {
    if (this.isMobile) {
      this._defaultImageSize = 200;
    }

    const width =
      this.attachmentData.width && this.attachmentData.width > 0 ? this.attachmentData.width : this._defaultImageSize;
    const height =
      this.attachmentData.height && this.attachmentData.height > 0
        ? this.attachmentData.height
        : this._defaultImageSize;

    let resizeWith = width;
    let resizeHeight = height;

    if (width !== this._defaultImageSize) {
      resizeWith = this._defaultImageSize;
      resizeHeight = (height * resizeWith) / width;

      if (resizeHeight > this._defaultImageSize) {
        resizeHeight = this._defaultImageSize;
        resizeWith = (width * resizeHeight) / height;
      }
    }

    return { width: resizeWith + 'px', height: resizeHeight + 'px', 'margin-bottom': '0' };
  }
}
