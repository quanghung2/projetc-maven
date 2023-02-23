import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DialogPosition, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IdentityProfileService, Member, OrgMemberService } from '@b3networks/api/auth';
import { ExtensionBase } from '@b3networks/api/bizphone';
import { WebrtcQuery, WebrtcService } from '@b3networks/api/call';
import { ExtensionQuery, MeQuery as MeCCQuery } from '@b3networks/api/callcenter';
import {
  Channel,
  ChannelQuery,
  ChannelService,
  ChannelType,
  ChannelUI,
  ChatChannelStoreName,
  GroupType,
  HistoryMessageService,
  Integration,
  IntegrationQuery,
  MediaService,
  MeQuery,
  NetworkService,
  Privacy,
  TXN_SECTION,
  UpdateChannelReq,
  User,
  UserQuery,
  UserService
} from '@b3networks/api/workspace';
import {
  ArchiveConvoComponent,
  InputSearchDialog,
  InviteMemberComponent,
  LeaveConvoComponent,
  SearchDialogComponent
} from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent, renderLinkForCopy, X } from '@b3networks/shared/common';
import { OrgChartDialogComponent } from '@b3networks/shared/ui/portal';
import { ToastService } from '@b3networks/shared/ui/toast';
import { EntityStoreAction, runEntityStoreAction } from '@datorama/akita';
import { ClipboardService } from 'ngx-clipboard';
import { combineLatest, Observable } from 'rxjs';
import { filter, finalize, map, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-conversation-details',
  templateUrl: './conversation-details.component.html',
  styleUrls: ['./conversation-details.component.scss']
})
export class ConversationDetailsComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  directChatUser$: Observable<User | Integration>;
  members$: Observable<User[]>;
  selectExtension$: Observable<ExtensionBase>;

  isFetchingTeam: boolean;
  isBot: boolean;
  isPermission: boolean;
  busyAgent: boolean;
  loadedFiles$: Observable<boolean>;
  file: any;

  @Input() convo: Channel;

  readonly Integration = Integration;
  readonly User = User;
  readonly TXN_SECTION = TXN_SECTION;
  readonly GroupType = GroupType;

  private convoId: string;

  constructor(
    private messageService: HistoryMessageService,
    private userQuery: UserQuery,
    private userService: UserService,
    private integrationQuery: IntegrationQuery,
    private toastService: ToastService,
    public dialog: MatDialog,
    private meQuery: MeQuery,
    private webrtcQuery: WebrtcQuery,
    private channelQuery: ChannelQuery,
    private channelService: ChannelService,
    private router: Router,
    private meCCQuery: MeCCQuery,
    private clipboardService: ClipboardService,
    private networkService: NetworkService,
    private webrtcService: WebrtcService,
    private mediaService: MediaService,
    private extensionQuery: ExtensionQuery,
    private identityProfileService: IdentityProfileService,
    private orgMemberService: OrgMemberService,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.meCCQuery.isPermission$
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(isPermission => (this.isPermission = isPermission));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['convo'] && this.convo != null && this.convoId !== this.convo.id) {
      this.convoId = this.convo.id;

      this.members$ = this.channelQuery.selectPropertyChannel(this.convo.id, 'participants').pipe(
        map(participants => {
          return this.userQuery.getAllUserByChatUuid(participants?.map(m => m.userID) || []);
        }),
        map(m => this.sort(m))
      );

      this.loadedFiles$ = this.channelQuery.selectUIState(this.convo.id, 'file').pipe(map(file => file?.loaded));
      const uiFile = this.channelQuery.getChannelUiState(this.convo.id);
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
        let _uuid: string;
        this.directChatUser$ = combineLatest([
          this.userQuery.selectUserByChatUuid(this.convo.directChatUsers.otherUuid),
          this.integrationQuery.selectAllByChatUuid(this.convo.directChatUsers.otherUuid)
        ]).pipe(
          map(x => x[0] || x[1]),
          filter(user => user != null),
          tap(user => {
            this.isBot = user.isBot;
            if (_uuid !== user.userUuid) {
              _uuid = user.userUuid;
              this.isFetchingTeam = false;
            }

            if (!this.isFetchingTeam && !user.isBot && user instanceof User) {
              this.isFetchingTeam = true;
              this.selectExtension$ = this.extensionQuery.selectExtensionByUser(user.identityUuid);
              this.fetchTeam(user);
              this.cdr.detectChanges();
            }
          })
        );
      }
    }
  }

  onOpenOrgChartDialog(identityUuid: string) {
    this.dialog.open(OrgChartDialogComponent, {
      data: { identityUuid },
      restoreFocus: false,
      disableClose: true
    });
  }

  upload($event) {
    this.file = Array.from((event.target as any).files) as File[];
    console.log(' this.file: ', this.file);
  }

  openSearchMessages() {
    this.dialog.open(SearchDialogComponent, {
      data: <InputSearchDialog>{
        key: '',
        channel: this.convo,
        isPersonalBookmark: this.convo.isPersonalBookmark
      },
      width: '50%',
      height: '100%',
      maxWidth: 'unset',
      position: <DialogPosition>{ right: '0px' },
      panelClass: 'search-message',
      autoFocus: false
    });
  }

  copyLink() {
    this.clipboardService.copyFromContent(renderLinkForCopy(this.router));
    this.toastService.success('Copy link successfully!');
  }

  inviteMember() {
    this.dialog.open(InviteMemberComponent, {
      width: '600px',
      data: this.convo,
      disableClose: true
    });
  }

  leaveConvo() {
    if (this.convo.privacy === Privacy.public) {
      this.leaveConvoAndNavigateGeneral(this.convo);
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
            this.leaveConvoAndNavigateGeneral(this.convo);
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

  // only call with WebRTC
  makeCallTo(number: string, user: User | Integration) {
    if (!this.webrtcQuery.UA?.isRegistered()) {
      this.toastService.error(
        'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.'
      );
      return;
    }

    if (this.webrtcQuery.isBusy) {
      this.toastService.error('You are on a call process.');
      return;
    }

    if (!this.networkService.isOnline) {
      this.toastService.warning(
        "Your computer seems to be offline. We'll keep trying to reconnect, or you can try refresh your browser",
        10e3
      );
      return;
    }

    this.webrtcService.makeCallOutgoing(number, user as User);
  }

  private leaveConvoAndNavigateGeneral(convo: Channel) {
    const me = this.meQuery.getMe();
    if (me) {
      const req = <UpdateChannelReq>{
        del: [me.userUuid]
      };
      this.channelService.addOrRemoveParticipants(convo.id, req).subscribe(_ => {
        // clear message, because websocket not send msg
        this.messageService.cleanupConvoMessages([this.convo.id]);
        this.channelService.resetChannelViewStateHistory(this.convo.id);

        const general = this.channelQuery.getGeneral();
        this.router.navigate(['conversations', general[0].id], {
          queryParamsHandling: 'merge'
        });
        this.channelService.closeConversation(convo.id);
      });
    }
  }

  private sort(members: User[]) {
    return members.sort((a, b) => +b.isOnline - +a.isOnline);
  }

  private fetchTeam(user: User) {
    const ui = this.userQuery.getUiState(user.uuid);
    if (!ui?.loadedTeams) {
      this.identityProfileService
        .getTeams(user.identityUuid)
        .pipe(finalize(() => (this.isFetchingTeam = false)))
        .subscribe(teams => {
          this.userService.updateUsers2Store([
            <User>{
              uuid: user.uuid,
              teams: teams
            }
          ]);
          this.userService.updateUserViewState(user.uuid, {
            loadedTeams: true
          });
        });
    }

    if (!ui?.loadedDetailFromAuth) {
      this.orgMemberService.getMember(X.orgUuid, user.identityUuid).subscribe((member: Member) => {
        this.userService.updateUsers2Store([
          <User>{
            uuid: user.uuid,
            about: member.about
          }
        ]);
        this.userService.updateUserViewState(user.uuid, {
          loadedDetailFromAuth: true
        });
      });
    }
  }
}
