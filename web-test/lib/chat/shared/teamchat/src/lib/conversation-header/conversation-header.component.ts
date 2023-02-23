import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  PersonalAppSettings,
  PersonalSettingsQuery,
  PersonalSettingsService,
  UnifiedWorkspaceSetting
} from '@b3networks/api/portal';
import {
  Channel,
  ChannelQuery,
  ChannelType,
  ChannelUI,
  ConversationGroupUI,
  HistoryMessageQuery,
  Integration,
  IntegrationQuery,
  StarService,
  User,
  UserQuery
} from '@b3networks/api/workspace';
import {
  AppQuery,
  AppService,
  EditDescriptionComponent,
  ModeSidebar,
  RenameConversationComponent
} from '@b3networks/chat/shared/core';
import { APP_IDS, X } from '@b3networks/shared/common';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-conversation-header',
  templateUrl: './conversation-header.component.html',
  styleUrls: ['./conversation-header.component.scss']
})
export class ConversationHeaderComponent implements OnInit, OnChanges {
  readonly ChannelType = ChannelType;

  private _id: string;

  @Input() channel: Channel;

  isBot: boolean;
  directUser$: Observable<User | Integration>; // direct chat user
  uiStateConvo$: Observable<ConversationGroupUI | ChannelUI>;

  toggleInfoBtn$: Observable<boolean>;
  loading$: Observable<boolean>;
  link = '';

  constructor(
    private userQuery: UserQuery,
    private integrationQuery: IntegrationQuery,
    private messageQuery: HistoryMessageQuery,
    private channelQuery: ChannelQuery,
    private personalSettingsQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private dialog: MatDialog,
    private starService: StarService,
    private appQuery: AppQuery,
    private appService: AppService
  ) {}

  ngOnInit() {
    this.loading$ = this.messageQuery.selectLoading().pipe(distinctUntilChanged());
    this.toggleInfoBtn$ = this.appQuery.modeRightSidebar$.pipe(
      switchMap(mode =>
        mode === ModeSidebar.side
          ? this.personalSettingsQuery
              .selectAppSettings(X.orgUuid, APP_IDS.UNIFIED_WORKSPACE)
              .pipe(map((result: PersonalAppSettings) => (result as UnifiedWorkspaceSetting)?.showRightSidebar))
          : this.appQuery.showRightSidebar$
      )
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['channel'] && this.channel != null && this.channel.id !== this._id) {
      this._id = this.channel.id;
      if (!this.channel.isGroupChat) {
        this.directUser$ = combineLatest([
          this.userQuery.selectUserByChatUuid(this.channel.directChatUsers.otherUuid),
          this.integrationQuery.selectAllByChatUuid(this.channel.directChatUsers.otherUuid)
        ]).pipe(
          map(x => x[0] || x[1]),
          tap(u => (this.isBot = u.isBot))
        );
      }
      this.uiStateConvo$ = this.channelQuery.selectChannelUiState(this.channel.id);
    }
  }

  editChannel() {
    this.dialog.open(RenameConversationComponent, {
      width: '600px',
      data: this.channel
    });
  }

  starConvo(channel: Channel) {
    this.starService.starChannelTeamChat(channel.id).subscribe();
  }

  unstarConvo(convo: Channel) {
    this.starService.unstarChannelTeamChat(convo.id).subscribe();
  }

  viewDetail(toggleInfoBtn: boolean) {
    const mode = this.appQuery.getValue()?.modeRightSidebar;
    if (mode === ModeSidebar.side) {
      const settings = <UnifiedWorkspaceSetting>(
        this.personalSettingsQuery.getAppSettings(X.orgUuid, APP_IDS.UNIFIED_WORKSPACE)
      );
      settings.showRightSidebar = !toggleInfoBtn;
      this.personalSettingService.updateStorePersonal(settings);
      this.personalSettingService.updateAppSettings(settings, true).subscribe();
    } else if (mode === ModeSidebar.over) {
      this.appService.update({
        showRightSidebar: !toggleInfoBtn
      });
    }
  }

  viewMenu(toggleInfoBtn: boolean) {
    const mode = this.appQuery.getValue()?.modeRightSidebar;
    if (mode === ModeSidebar.over) {
      this.appService.update({
        showLeftSidebar: !toggleInfoBtn
      });
    }
  }

  editDescription() {
    this.dialog.open(EditDescriptionComponent, {
      width: '600px',
      data: this.channel
    });
  }
}
