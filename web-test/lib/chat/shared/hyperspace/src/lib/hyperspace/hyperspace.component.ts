import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalSettingsQuery, PersonalSettingsService, UnifiedWorkspaceSetting } from '@b3networks/api/portal';
import {
  ChannelHyperspace,
  ChannelHyperspaceQuery,
  ChannelHyperspaceService,
  ChannelQuery,
  ChannelService,
  ChannelType,
  ChatMessage,
  ChatService,
  Hyperspace,
  HyperspaceQuery,
  HyperspaceService,
  MappingHyperData,
  MeQuery,
  SocketStatus
} from '@b3networks/api/workspace';
import {
  AppQuery,
  AppService,
  ModeSidebar,
  RIGHT_SIDEBAR_ID,
  UploadDialogInput,
  UploadDialogV2Component
} from '@b3networks/chat/shared/core';
import { APP_IDS, DestroySubscriberComponent, LocalStorageUtil, X } from '@b3networks/shared/common';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, debounceTime, filter, mergeMap, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { HyperspaceFooterComponent } from './hyperspace-footer/hyperspace-footer.component';

@Component({
  selector: 'b3n-hyperspace',
  templateUrl: './hyperspace.component.html',
  styleUrls: ['./hyperspace.component.scss']
})
export class HyperspaceComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  readonly RIGHT_SIDEBAR_ID = RIGHT_SIDEBAR_ID;

  private _id: string;
  private _channel: ChannelHyperspace;
  channel$: Observable<ChannelHyperspace>;
  hyper$: Observable<Hyperspace>;

  @ViewChild(HyperspaceFooterComponent) footer: HyperspaceFooterComponent;

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
    private router: Router,
    private meQuery: MeQuery,
    private route: ActivatedRoute,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private channelHyperspaceService: ChannelHyperspaceService,
    private hyperspaceService: HyperspaceService,
    private hyperspaceQuery: HyperspaceQuery,
    private dialog: MatDialog,
    private chatService: ChatService,
    private personalSettingsQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private channelServie: ChannelService,
    private channelQuery: ChannelQuery,
    private appQuery: AppQuery,
    private appService: AppService
  ) {
    super();
  }

  override destroy() {
    // send seen when destroy this current channel
    if (this._id) {
      this.sendSeenPreviousChannel(this._id);
    }
  }

  ngOnInit() {
    this.channel$ = this.channelHyperspaceQuery.selectActive().pipe(
      debounceTime(10),
      filter(x => x != null),
      tap(channel => {
        if (channel.id !== this._id) {
          this.sendSeenPreviousChannel(this._id);

          this._id = channel.id;
          this._channel = channel;
        }
      })
    );

    // await init ws
    this.chatService.socketStatus$
      .pipe(
        filter(s => s != null && s === SocketStatus.opened),
        takeUntil(this.destroySubscriber$),
        take(1)
      )
      .subscribe(_ => {
        combineLatest([this.route.params, this.meQuery.me$])
          .pipe(
            debounceTime(10),
            filter(([__, me]) => me != null),
            mergeMap(([params, me]) => {
              const hyperId: string = params['hyperId'];
              if (hyperId) {
                this.hyper$ = this.hyperspaceQuery.selectHyperByHyperspaceId(hyperId).pipe(filter(x => x != null));
              }

              return hyperId
                ? this.hyper$.pipe(
                    filter(x => x != null),
                    take(1),
                    switchMap(hyper => {
                      if (hyper) {
                        this.hyperspaceService.updateHyperspaceViewState(hyper.id, { isExpand: true });
                      }

                      const id = params['id'];
                      const channel = this.channelHyperspaceQuery.getEntity(id);
                      return channel?.type === ChannelType.dm ||
                        (channel?.type === ChannelType.gc && channel.isMyChannel)
                        ? of(channel)
                        : this.channelHyperspaceService
                            .getDetails(hyper.hyperspaceId, id, <MappingHyperData>{
                              meUuid: me.userUuid,
                              currentOrg: X.orgUuid
                            })
                            .pipe(catchError(__ => of(null)));
                    })
                  )
                : of(null);
            }),
            takeUntil(this.destroySubscriber$)
          )
          .subscribe(channel => {
            if (channel != null) {
              this.channelServie.updateRecentChannels(channel.id).subscribe();
              this.channelServie.removeActive(this.channelQuery.getActiveId());
              this.channelHyperspaceService.setActive(channel.id);
              LocalStorageUtil.setItem(`lastestView_v1_${X.orgUuid}`, encodeURIComponent(this.router.url));
            } else {
              // remove
              LocalStorageUtil.removeItem(`lastestView_v1_${X.orgUuid}`);

              // close right sidebar

              const mode = this.appQuery.getValue()?.modeRightSidebar;
              if (mode === ModeSidebar.side) {
                const settings = <UnifiedWorkspaceSetting>(
                  this.personalSettingsQuery.getAppSettings(X.orgUuid, APP_IDS.UNIFIED_WORKSPACE)
                );
                settings.showRightSidebar = false;
                this.personalSettingService.updateAppSettings(settings).subscribe();
              } else if (mode === ModeSidebar.over) {
                // toggle
                this.appService.update({
                  showRightSidebar: false
                });
              }
            }
          });
      });
  }

  onFocusQuillEditor() {
    if (this.footer?.quillEditorComponent) {
      this.footer?.quillEditorComponent.handleFocusInput();
    }
  }

  uploadFile(files: File[], index: number) {
    this.dialog
      .open(UploadDialogV2Component, {
        width: '500px',
        disableClose: true,
        data: <UploadDialogInput>{
          file: files[index],
          channelHyperspace: this._channel,
          index: index + 1,
          max: files.length
        }
      })
      .afterClosed()
      .subscribe(
        _ => {
          // next
          index = index + 1;
          if (index < files.length) {
            this.uploadFile(files, index);
          }
        },
        err => {
          // next
          index = index + 1;
          if (index < files.length) {
            this.uploadFile(files, index);
          }
        }
      );
  }

  private sendSeenPreviousChannel(id: string) {
    const previousChannel = this.channelHyperspaceQuery.getChannel(id);
    if (previousChannel) {
      const unreadCount = previousChannel.unreadCount;
      const viewingOlderMessage = this.channelHyperspaceQuery.getChannelUiState(id).viewingOlderMessage;
      if (unreadCount > 0 && !viewingOlderMessage) {
        this.chatService.send(ChatMessage.createSeenMessage(previousChannel));
      }
    }
  }

  private uploadMultipleFiles(files: File[]) {
    if (!files || files.length === 0) {
      return;
    }
    if (files.length > 0) {
      this.uploadFile(files, 0);
    }
  }
}
