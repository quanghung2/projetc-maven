import { AfterViewInit, ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Channel,
  ChannelQuery,
  ChannelService,
  ChannelType,
  ChatMessage,
  ChatService
} from '@b3networks/api/workspace';
import {
  AppQuery,
  AppService,
  RIGHT_SIDEBAR_ID,
  SidebarTabs,
  UploadDialogInput,
  UploadDialogV2Component
} from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { addHours } from 'date-fns';
import { Observable } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { ConversationFooterComponent } from './conversation-footer/conversation-footer.component';

@Component({
  selector: 'b3n-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss']
})
export class ConversationComponent extends DestroySubscriberComponent implements AfterViewInit, OnInit {
  readonly RIGHT_SIDEBAR_ID = RIGHT_SIDEBAR_ID;
  readonly ChannelType = ChannelType;

  private _id: string;
  private _channel: Channel;

  channel$: Observable<Channel>;

  @ViewChild(ConversationFooterComponent) footer: ConversationFooterComponent;

  @HostListener('dragover', ['$event']) onDragOver(evt: DragEvent | any) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('drop', ['$event']) onDrop(event: DragEvent | any) {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer.files) as File[];
    this.uploadMultipleFiles(files);
  }

  constructor(
    private channelQuery: ChannelQuery,
    private channelService: ChannelService,
    private chatService: ChatService,
    private dialog: MatDialog,
    private appService: AppService,
    private appQuery: AppQuery,
    private cdr: ChangeDetectorRef
  ) {
    super();
    this.appService.update({ sidebarTabActive: SidebarTabs.teamchat });
  }

  ngOnInit(): void {
    this.saveStatePreviousChannel();
    this.appQuery.quillEditor$.pipe(takeUntil(this.destroySubscriber$)).subscribe(value => {
      if (this.footer?.quillEditorComponent) {
        this.footer?.quillEditorComponent.handleFocusInput();
      }
    });
  }

  ngAfterViewInit() {
    this.channel$ = this.channelQuery.selectActive().pipe(tap(channel => (this._channel = channel)));
    this.cdr.detectChanges();
  }

  uploadFile(models: File[], index: number) {
    this.dialog
      .open(UploadDialogV2Component, {
        width: '500px',
        disableClose: true,
        data: <UploadDialogInput>{
          file: models[index],
          channel: this._channel,
          index: index + 1,
          max: models.length
        }
      })
      .afterClosed()
      .subscribe(
        _ => {
          // next
          index = index + 1;
          if (index < models.length) {
            this.uploadFile(models, index);
          }
        },
        err => {
          // next
          index = index + 1;
          if (index < models.length) {
            this.uploadFile(models, index);
          }
        }
      );
  }

  private uploadMultipleFiles(files: File[]) {
    if (!files || files.length === 0) {
      return;
    }
    if (files.length > 0) {
      this.uploadFile(files, 0);
    }
  }

  private saveStatePreviousChannel() {
    this.channelQuery
      .selectActive()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(channel => {
        if (channel && channel?.id !== this._id) {
          const preId = this._id;
          this._id = channel.id;
          const previousChannel = this.channelQuery.getChannel(preId);
          if (previousChannel) {
            this.channelService.updateChannelViewState(previousChannel.id, {
              timeDestroy: addHours(new Date(), 3).getTime()
            });

            const viewingOlderMessage = this.channelQuery.getChannelUiState(preId)?.viewingOlderMessage;
            if (previousChannel.unreadCount > 0 && !viewingOlderMessage) {
              this.chatService.send(ChatMessage.createSeenMessage(previousChannel));
            }
          }
        }
      });
  }
}
