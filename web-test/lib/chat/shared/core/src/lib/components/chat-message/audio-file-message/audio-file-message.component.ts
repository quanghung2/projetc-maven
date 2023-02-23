import { Component, Input, OnInit } from '@angular/core';
import { CacheMedia, CacheMediaQuery, CacheMediaService } from '@b3networks/api/common';
import { FileService, RequestUploadData } from '@b3networks/api/file';
import {
  AttachmentMessageData,
  ChatMessage,
  ChatService,
  MediaService,
  PREFIX_ORIGINAL
} from '@b3networks/api/workspace';
import { UUID_V4_REGEX, X } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

@Component({
  selector: 'csh-audio-file-message',
  templateUrl: './audio-file-message.component.html',
  styleUrls: ['./audio-file-message.component.scss']
})
export class AudioFileMessageComponent implements OnInit {
  @Input() message: ChatMessage;
  @Input() parentElr: HTMLElement;
  @Input() isPublic: boolean;

  noIntersectionObserver: boolean;
  src: string;

  constructor(
    private mediaService: MediaService,
    private cacheMediaQuery: CacheMediaQuery,
    private fileService: FileService,
    private cacheMediaService: CacheMediaService,
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
        this.initAudio(url);
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

    api$?.pipe(filter(src => src != null))?.subscribe(src => this.initAudio(src));
  }

  private initAudio(src: string) {
    this.src = src;
  }

  private withoutOrgUuid(fileKey: string) {
    let s3KeyWithouOrgUuid = fileKey;
    const rs: RegExpMatchArray = s3KeyWithouOrgUuid.match(UUID_V4_REGEX);
    if (rs && rs.index === 0) {
      s3KeyWithouOrgUuid = s3KeyWithouOrgUuid.slice(37);
    }
    return s3KeyWithouOrgUuid;
  }
}
