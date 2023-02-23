import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { CacheMedia, CacheMediaQuery, CacheMediaService } from '@b3networks/api/common';
import { FileService, RequestUploadData } from '@b3networks/api/file';
import {
  AttachmentMessageData,
  ChatMessage,
  ChatService,
  MediaService,
  PREFIX_ORIGINAL
} from '@b3networks/api/workspace';
import { donwloadFromUrl, download, downloadData, UUID_V4_REGEX, X } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';

declare const videojs: any;

@Component({
  selector: 'csh-video-file-message',
  templateUrl: './video-file-message.component.html',
  styleUrls: ['./video-file-message.component.scss']
})
export class VideoFileMessageComponent implements OnInit, OnDestroy {
  @Input() message: ChatMessage;
  @Input() parentElr: HTMLElement;
  @Input() isPublic: boolean;

  options: any = {
    controls: true,
    paused: true,
    playbackRates: [0.25, 0.5, 1, 1.5, 2],
    userActions: {
      hotkeys: true
    }
  };
  player: any;
  noIntersectionObserver: boolean;
  isError: boolean;

  constructor(
    private mediaService: MediaService,
    private cacheMediaQuery: CacheMediaQuery,
    private fileService: FileService,
    private elr: ElementRef,
    private cacheMediaService: CacheMediaService,
    private cdr: ChangeDetectorRef,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    const attachmentData: AttachmentMessageData = this.message.body.data?.attachment || this.message.body.data;
    if (attachmentData) {
      const isStorage = !!attachmentData?.uri && attachmentData.uri.startsWith('storage://');

      let url = null,
        keyWithOrgUuid: string;
      if (isStorage) {
        keyWithOrgUuid = attachmentData.uri.replace('storage://', '');
        url = this.cacheMediaQuery.getMediaByKey(keyWithOrgUuid, true)?.url;
      } else {
        keyWithOrgUuid = attachmentData.mediaUuid ? attachmentData.mediaUuid : attachmentData.fileUuid;
        url = this.cacheMediaQuery.getMediaByKey(keyWithOrgUuid + PREFIX_ORIGINAL, false)?.url;
      }

      this.noIntersectionObserver = !!url;

      if (url) {
        this.cdr.detectChanges();
        this.initPlayer(url);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.player) {
      this.player.dispose();
    }
  }

  downloadVideo() {
    const attachmentData: AttachmentMessageData = this.message.body.data?.attachment || this.message.body.data;

    const isStorage = !!attachmentData?.uri && attachmentData.uri.startsWith('storage://');
    let url = null,
      keyWithOrgUuid: string;
    if (isStorage) {
      keyWithOrgUuid = attachmentData.uri.replace('storage://', '');
      url = this.cacheMediaQuery.getMediaByKey(keyWithOrgUuid, true)?.url;
    } else {
      keyWithOrgUuid = attachmentData.mediaUuid ? attachmentData.mediaUuid : attachmentData.fileUuid;
      url = this.cacheMediaQuery.getMediaByKey(keyWithOrgUuid, false)?.url;
    }

    if (url) {
      donwloadFromUrl(url, attachmentData.name, () => {
        URL.revokeObjectURL(url);
        this.cacheMediaService.remove(keyWithOrgUuid);
      });
    } else {
      if (!!attachmentData?.uri && attachmentData.uri.startsWith('storage://')) {
        keyWithOrgUuid = attachmentData.uri.replace('storage://', '');
        if (this.message.hs) {
          this.chatService.session$
            .pipe(
              filter(x => x != null),
              take(1)
            )
            .subscribe(session => {
              this.fileService
                .downloadFileV3Public(keyWithOrgUuid, <RequestUploadData>{
                  chatUserId: session.chatUser,
                  orgUuid: !!this.message?.hs ? this.message?.ns : X.orgUuid,
                  wssToken: session.token,
                  chatServer: session.addr,
                  convoType: this.message.ct,
                  hyperspaceId: this.message?.hs,
                  mediaOrgUuid: this.message?.ns
                })
                .subscribe(resp => {
                  const file = new Blob([resp.body], { type: `${resp.body.type}` });
                  downloadData(file, attachmentData.name);
                });
            });
        } else {
          this.fileService.downloadFileV3(keyWithOrgUuid).subscribe(resp => {
            const file = new Blob([resp.body], { type: `${resp.body.type}` });
            downloadData(file, attachmentData.name);
          });
        }
      } else {
        const mediaUuid = attachmentData.mediaUuid ? attachmentData.mediaUuid : attachmentData.fileUuid;
        if (mediaUuid) {
          if (this.isPublic) {
            this.mediaService.getMediaImgOriginalPublic(mediaUuid, this.message.convo).subscribe(res => {
              download(res['url'], attachmentData.name);
            });
          } else {
            this.mediaService.getMediaImgOriginal(mediaUuid, this.message.convo).subscribe(res => {
              download(res['url'], attachmentData.name);
            });
          }
        }
      }
    }
  }

  onRender() {
    let api$: Observable<string>, keyWithOrgUuid: string;
    const attachmentData: AttachmentMessageData = this.message.body.data?.attachment || this.message.body.data;

    if (!!attachmentData?.uri && attachmentData.uri.startsWith('storage://')) {
      keyWithOrgUuid = attachmentData.uri.replace('storage://', '');
      if (this.message.hs) {
        const session = this.chatService.session;
        api$ = this.fileService
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
            }),
            tap(src => {
              keyWithOrgUuid = this.withoutOrgUuid(keyWithOrgUuid);
              this.cacheMediaService.add(
                new CacheMedia({
                  key: keyWithOrgUuid,
                  url: src
                })
              );
            })
          );
      } else {
        api$ = this.fileService.downloadFileV3(keyWithOrgUuid).pipe(
          map(resp => {
            const file = new Blob([resp.body], { type: `${resp.body.type}` });
            return URL.createObjectURL(file);
          }),
          tap(src => {
            keyWithOrgUuid = this.withoutOrgUuid(keyWithOrgUuid);
            this.cacheMediaService.add(
              new CacheMedia({
                key: keyWithOrgUuid,
                url: src
              })
            );
          })
        );
      }
    } else {
      const mediaUuid = attachmentData.mediaUuid ? attachmentData.mediaUuid : attachmentData.fileUuid;
      if (mediaUuid) {
        if (this.isPublic) {
          api$ = this.mediaService.getMediaImgOriginalPublic(mediaUuid, this.message.convo).pipe(
            map(res => res['url']),
            tap(src => {
              this.cacheMediaService.add(
                new CacheMedia({
                  key: mediaUuid + PREFIX_ORIGINAL,
                  url: src,
                  time: Date.now()
                })
              );
            })
          );
        } else {
          api$ = this.mediaService.getMediaImgOriginal(mediaUuid, this.message.convo).pipe(
            map(res => res['url']),
            tap(src => {
              this.cacheMediaService.add(
                new CacheMedia({
                  key: mediaUuid + PREFIX_ORIGINAL,
                  url: src,
                  time: Date.now()
                })
              );
            })
          );
        }
      }
    }

    api$?.pipe(filter(src => src != null))?.subscribe(src => this.initPlayer(src));
  }

  private initPlayer(src: string) {
    this.elr.nativeElement?.querySelector('.video-js').addEventListener('error', event => {
      console.log(event.target.error.message);
      this.isError = true;
    });

    this.options.sources = [{ src, type: 'video/mp4' }];
    this.player = videojs(this.elr.nativeElement?.querySelector('.video-js'), this.options, () => {});

    // add download button
    this.player.on('play', () => {
      const hasDownloadBtn = this.elr.nativeElement.querySelector('.vjs-download-button');
      if (!hasDownloadBtn) {
        const button = document.createElement('button');
        button.classList.add('vjs-download-button');
        button.innerHTML = `<span class='material-icons' style='font-size: 20px;cursor: pointer;'>download</span>`;
        button.onclick = () => this.download();

        const backplayRateBtn = this.elr.nativeElement.querySelector('.vjs-playback-rate');
        if (backplayRateBtn) {
          backplayRateBtn.parentNode.insertBefore(button, backplayRateBtn.nextSibling);
        }
      }
    });
  }

  private withoutOrgUuid(fileKey: string) {
    let s3KeyWithouOrgUuid = fileKey;
    const rs: RegExpMatchArray = s3KeyWithouOrgUuid.match(UUID_V4_REGEX);
    if (rs && rs.index === 0) {
      s3KeyWithouOrgUuid = s3KeyWithouOrgUuid.slice(37);
    }
    return s3KeyWithouOrgUuid;
  }

  private download() {
    const attachmentData: AttachmentMessageData = this.message.body.data?.attachment || this.message.body.data;

    if (attachmentData) {
      const isStorage = !!attachmentData?.uri && attachmentData.uri.startsWith('storage://');

      let url = null,
        keyWithOrgUuid: string;
      if (isStorage) {
        keyWithOrgUuid = attachmentData.uri.replace('storage://', '');
        url = this.cacheMediaQuery.getMediaByKey(keyWithOrgUuid, true)?.url;
      } else {
        keyWithOrgUuid = attachmentData.mediaUuid ? attachmentData.mediaUuid : attachmentData.fileUuid;
        url = this.cacheMediaQuery.getMediaByKey(keyWithOrgUuid + PREFIX_ORIGINAL, false)?.url;
      }

      if (url) {
        download(url, attachmentData.name);
      } else {
        if (!!attachmentData?.uri && attachmentData.uri.startsWith('storage://')) {
          keyWithOrgUuid = attachmentData.uri.replace('storage://', '');
          this.fileService.downloadFileV3(keyWithOrgUuid).subscribe(resp => {
            const file = new Blob([resp.body], { type: `${resp.body.type}` });
            downloadData(file, attachmentData.name);
          });
        } else {
          const mediaUuid = attachmentData.mediaUuid ? attachmentData.mediaUuid : attachmentData.fileUuid;
          if (mediaUuid) {
            if (this.isPublic) {
              this.mediaService.getMediaImgOriginalPublic(mediaUuid, this.message.convo).subscribe(res => {
                download(res['url'], attachmentData.name);
              });
            } else {
              this.mediaService.getMediaImgOriginal(mediaUuid, this.message.convo).subscribe(res => {
                download(res['url'], attachmentData.name);
              });
            }
          }
        }
      }
    }
  }
}
