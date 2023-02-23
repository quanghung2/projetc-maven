import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AddReq,
  AttachmentMessageData,
  MediaConversationType,
  MediaService,
  MsgType,
  PrivateNote,
  PrivateNoteQuery,
  PrivateNoteService,
  S3Service,
  Uploader,
  UploadStatus
} from '@b3networks/api/workspace';
import { download, X } from '@b3networks/shared/common';
import { forkJoin, Observable } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { AddPrivateNoteComponent } from './add-private-note/add-private-note.component';

declare let Viewer: any;

@Component({
  selector: 'csl-private-note',
  templateUrl: './private-note.component.html',
  styleUrls: ['./private-note.component.scss']
})
export class PrivateNoteComponent implements OnInit, OnChanges {
  @Input() txns: string[];
  @Input() isViewingCase: boolean;

  expanded = true;
  // hasMore: boolean;
  // conversationGroupId: string;
  uploadPercentage = 0;
  uploading = false;
  medias = new Set<string>();

  privateNotes$: Observable<PrivateNote[]>;
  isLoading$: Observable<boolean>;

  readonly MsgType = MsgType;

  constructor(
    private privateNoteQuery: PrivateNoteQuery,
    private privateNoteService: PrivateNoteService,
    private dialog: MatDialog,
    private s3Service: S3Service,
    private mediaService: MediaService
  ) {}

  ngOnInit() {
    this.privateNotes$ = this.privateNoteQuery.privateNotes$;
    this.isLoading$ = this.privateNoteQuery.isLoading$;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['txns']) {
      this.medias.clear();
      this.privateNotes$ = this.privateNoteQuery.seletePrivateNotesByTxns(this.txns);

      if (!this.isViewingCase) {
        this.getPrivateNotes();
      }
    }
  }

  trackByPrivateNote(_, item: PrivateNote) {
    return item?.createdAt;
  }

  parseNote(note: PrivateNote) {
    if (note.msgType === MsgType.message) {
      return note.jsonMessage?.replace(/\n/g, '<br />');
    } else if (note.msgType === MsgType.attachment) {
      const msg = JSON.parse(note.jsonMessage);
      if (msg.mediaUuid && !this.medias.has(msg.mediaUuid)) {
        this.medias.add(msg.mediaUuid);
        this.mediaService
          .getMediaImgThumbnail(msg.mediaUuid, note.txnUuid)
          .pipe(delay(500))
          .subscribe(res => {
            if (!res?.url) {
              return;
            }

            const div = document.getElementById(note.noteId.toString());

            if (div && div.getElementsByTagName('img').length === 0) {
              const img = document.createElement('img');
              img.src = res?.url;
              img.style.borderRadius = '5px';
              img.style.padding = '2px';
              img.style.background = '#e0e0e0';

              img.onmouseover = () => {
                img.style.cursor = 'zoom-in';
              };
              img.onclick = () => {
                this.mediaService.getMediaImgOriginal(msg.mediaUuid, note.txnUuid).subscribe(resp => {
                  const image = new Image();
                  image.src = resp?.url;
                  const viewer = new Viewer(image, {
                    hidden: () => {
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
              };
              div.appendChild(img);
            }
          });
      }
      return '';
    } else {
      return 'Unknown';
    }
  }

  download(note: PrivateNote) {
    const msg = JSON.parse(note.jsonMessage);
    this.mediaService.getMediaImgOriginal(msg.mediaUuid, note.txnUuid).subscribe(res => {
      download(res['url'], msg.name);
    });
  }

  addPrivateNote() {
    const dialogRef = this.dialog.open(AddPrivateNoteComponent, {
      width: '600px',
      data: this.txns[0]
    });

    dialogRef.afterClosed().subscribe();
  }

  upload(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      const isImage = file['type'].includes('image');
      const conversationGroupId = this.txns[0];
      const mediaConvoType = MediaConversationType.whatsapp;

      // TODO: Because render message does still not support
      if (!isImage) {
        return;
      }
      // process attachment
      const uploader: Uploader = this.s3Service.upload(X.orgUuid, file, conversationGroupId, mediaConvoType);
      this.uploadPercentage = 0;

      if (uploader) {
        this.uploading = true;
        uploader.subscribe(
          uploadingProcess => {
            this.uploadPercentage = uploadingProcess.percentage;

            if (uploadingProcess.status === UploadStatus.completed) {
              this.uploading = false;
              const responseUrl = `https://dl.b3.work/${uploader.fileResp.s3Key}`;
              this.s3Service
                .putMediaUuid(uploader.fileResp.mediaUuid)
                .pipe(switchMap(() => this.s3Service.createAttachment(conversationGroupId, uploader.fileResp.s3Key)))
                .subscribe(rs => {
                  const bodyText = new AttachmentMessageData({
                    name: file.fileName,
                    uri: responseUrl,
                    fileType: file.name.split('.').pop(),
                    size: file.size,
                    fileUuid: rs['uuid'],
                    s3Key: uploader.fileResp.s3Key,
                    mediaUuid: uploader.fileResp.mediaUuid
                  });
                  this.privateNoteService
                    .add(conversationGroupId, new AddReq(JSON.stringify(bodyText), MsgType.attachment))
                    .subscribe(
                      () => {},
                      error => {
                        console.error(error);
                      }
                    );
                });
            }
          },
          error => {
            this.uploading = false;
            console.error(error.message);
          }
        );
      }
      event.target.value = '';
    }
  }

  private getPrivateNotes() {
    const api$ = this.groupBy(this.txns, 10).map(txnUuids =>
      // api max 10 txns
      this.privateNoteService.getPrivateNotesByTxns(txnUuids)
    );
    forkJoin(api$).subscribe();
  }

  private groupBy(arr: string[], n: number) {
    const group = [];
    for (let i = 0, end = arr.length / n; i < end; ++i) group.push(arr.slice(i * n, (i + 1) * n));
    return group;
  }
}
