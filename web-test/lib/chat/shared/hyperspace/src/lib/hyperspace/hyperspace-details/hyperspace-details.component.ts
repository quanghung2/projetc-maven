import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  ChannelHyperspace,
  ChannelHyperspaceQuery,
  ChannelHyperspaceService,
  ChannelQuery,
  ChannelService,
  ChannelType,
  ChannelUI,
  ChatChannelStoreName,
  GroupType,
  HistoryMessageService,
  Hyperspace,
  HyperspaceQuery,
  MediaService,
  MeQuery,
  Privacy,
  RequestNamespacesHyper,
  ReqUpdateUsersChannelHyper,
  TXN_SECTION,
  UserHyperspace
} from '@b3networks/api/workspace';
import {
  ArchiveConvoComponent,
  InviteMemberHyperComponent,
  InviteMemberHyperInput,
  LeaveConvoComponent
} from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent, renderLinkForCopy, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { EntityStoreAction, runEntityStoreAction } from '@datorama/akita';
import { ClipboardService } from 'ngx-clipboard';
import { Observable } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-hyperspace-details',
  templateUrl: './hyperspace-details.component.html',
  styleUrls: ['./hyperspace-details.component.scss']
})
export class HyperspaceDetailsComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() convo: ChannelHyperspace;
  @Input() hyper: Hyperspace;

  directChatUser$: Observable<UserHyperspace>;
  membersCurrentOrg$: Observable<UserHyperspace[]>;
  membersOtherOrg$: Observable<UserHyperspace[]>;

  busyAgent: boolean;
  loadedFiles$: Observable<boolean>;

  readonly TXN_SECTION = TXN_SECTION;
  readonly GroupType = GroupType;

  private _convoId: string;

  constructor(
    private messageService: HistoryMessageService,
    private toastService: ToastService,
    public dialog: MatDialog,
    private meQuery: MeQuery,
    private channelQuery: ChannelQuery,
    private channelService: ChannelService,
    private router: Router,
    private clipboardService: ClipboardService,
    private mediaService: MediaService,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private channelHyperspaceService: ChannelHyperspaceService,
    private hyperspaceQuery: HyperspaceQuery
  ) {
    super();
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['convo'] && this._convoId !== this.convo.id) {
      this._convoId = this.convo.id;

      this.membersCurrentOrg$ = this.channelHyperspaceQuery.selectPropertyChannel(this.convo.id, 'allMembers').pipe(
        map(x => x || []),
        switchMap(participants =>
          this.hyperspaceQuery
            .selectPropertyHyperspace(this.hyper.id, 'allMembers')
            .pipe(
              map(users =>
                (participants || [])
                  ?.map(p => users.find(u => u.userUuid === p.userID && u.orgUuid === X.orgUuid))
                  .filter(x => !!x)
              )
            )
        ),
        map(m => m?.sort((a, b) => +b.isOnline - +a.isOnline))
      );

      this.membersOtherOrg$ = this.channelHyperspaceQuery.selectPropertyChannel(this.convo.id, 'allMembers').pipe(
        map(x => x || []),
        switchMap(participants =>
          this.hyperspaceQuery
            .selectPropertyHyperspace(this.hyper.id, 'allMembers')
            .pipe(
              map(users =>
                (participants || [])
                  ?.map(p => users.find(u => u.userUuid === p.userID && u.orgUuid !== X.orgUuid))
                  .filter(x => !!x)
              )
            )
        ),
        map(m => m?.sort((a, b) => +b.isOnline - +a.isOnline))
      );

      this.loadedFiles$ = this.channelHyperspaceQuery
        .selectUIState(this.convo.id, 'file')
        .pipe(map(file => file?.loaded));

      const uiFile = this.channelHyperspaceQuery.getChannelUiState(this.convo.id);
      if (!uiFile?.file?.loaded) {
        const page = uiFile?.file?.page || 1;
        const perPage = uiFile?.file?.perPage || 10;
        this.mediaService.getThumbnails(this.convo.id, page, perPage).subscribe(list => {
          this.channelService.updateChannelViewState(this.convo.id, <Partial<ChannelUI>>{
            file: {
              page,
              perPage,
              loaded: true,
              hasMore: list.length === perPage
            }
          });
        });
      }

      if (this.convo.type === ChannelType.dm) {
        this.directChatUser$ = this.hyperspaceQuery
          .selectPropertyHyperspace(this.hyper.id, 'allMembers')
          .pipe(map(item => item.find(x => x.userUuid === this.convo.directChatUsers.otherUuid)));
      }
    }
  }

  openSearchMessages() {
    // this.dialog.open(SearchDialogComponent, {
    //   data: <InputSearchDialog>{
    //     key: '',
    //     channel: this.convo
    //   },
    //   width: '50%',
    //   height: '100%',
    //   maxWidth: 'unset',
    //   position: <DialogPosition>{ right: '0px' },
    //   panelClass: 'search-message',
    //   autoFocus: false
    // });
  }

  copyLink() {
    this.clipboardService.copyFromContent(renderLinkForCopy(this.router));
    this.toastService.success('Copy link successfully!');
  }

  inviteMember() {
    this.dialog.open(InviteMemberHyperComponent, {
      width: '600px',
      data: <InviteMemberHyperInput>{
        hyperId: this.hyper.id,
        channel: this.convo
      },
      disableClose: true
    });
  }

  leaveConvo() {
    if (this.convo.privacy === Privacy.public) {
      this.leaveConvoAndNavigateGeneral();
    } else {
      const dialog = this.dialog.open(LeaveConvoComponent, {
        width: '600px',
        data: this.convo
      });
      dialog
        .afterClosed()
        .pipe(takeUntil(this.destroySubscriber$))
        .subscribe(result => {
          if (result) {
            this.leaveConvoAndNavigateGeneral();
          }
        });
    }
  }

  archiveConvo() {
    this.dialog.open(ArchiveConvoComponent, {
      width: '600px',
      data: this.convo
    });
  }

  unarchiveConvo() {
    this.channelService.archivedOrUnarchiveChannel(this.convo.id, false).subscribe(_ => {
      runEntityStoreAction(ChatChannelStoreName, EntityStoreAction.UpdateEntities, update =>
        update(this.convo.id, { archivedAt: null, archivedBy: null })
      );
    });
  }

  copied() {
    this.toastService.success(`Copied to clipboard!`);
  }

  private leaveConvoAndNavigateGeneral() {
    const me = this.meQuery.getMe();
    const req: ReqUpdateUsersChannelHyper = {
      hyperspaceId: this.convo.hyperspaceId,
      hyperchannelId: this.convo.id,
      remove: [
        <RequestNamespacesHyper>{
          namespaceId: X.orgUuid,
          usersId: [me.userUuid]
        }
      ]
    };

    this.channelHyperspaceService.updateUsersChannelHyper(req).subscribe(_ => {
      // clear message, because websocket not send msg
      this.messageService.cleanupConvoMessages([this.convo.id]);
      this.channelHyperspaceService.resetChannelViewStateHistory(this.convo.id);

      const general = this.channelQuery.getGeneral();
      if (general) {
        this.router.navigate(['conversations', general[0].id], {
          queryParamsHandling: 'merge'
        });
      }
      this.channelHyperspaceService.closeConversation(this.convo.id);
    });
  }
}
