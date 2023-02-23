import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PersonalSettingsQuery, PersonalSettingsService, UnifiedWorkspaceSetting } from '@b3networks/api/portal';
import {
  ChannelHyperspace,
  ChannelHyperspaceQuery,
  ChannelHyperspaceService,
  ChannelQuery,
  ChannelService,
  ChannelType,
  HistoryMessageQuery,
  Hyperspace,
  StarService,
  User,
  UserQuery
} from '@b3networks/api/workspace';
import { AppQuery, AppService, EditDescriptionComponent, ModeSidebar } from '@b3networks/chat/shared/core';
import { APP_IDS, X } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'b3n-hyperspace-header',
  templateUrl: './hyperspace-header.component.html',
  styleUrls: ['./hyperspace-header.component.scss']
})
export class HyperspaceHeaderComponent implements OnInit, OnChanges {
  readonly ChannelType = ChannelType;

  private _id: string;

  @Input() channel: ChannelHyperspace;
  @Input() hyper: Hyperspace;

  directUser$: Observable<User>; // direct chat user
  viewDate$: Observable<number>;

  toggleInfoBtn$: Observable<boolean>;
  loading$: Observable<boolean>;
  link = '';

  constructor(
    private userQuery: UserQuery,
    private messageQuery: HistoryMessageQuery,
    private channelQuery: ChannelQuery,
    private channelService: ChannelService,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private channelHyperspaceService: ChannelHyperspaceService,
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
              .pipe(map(result => (result as UnifiedWorkspaceSetting)?.showRightSidebar))
          : this.appQuery.showRightSidebar$
      )
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['channel'] && this.channel != null && this.channel.id !== this._id) {
      this._id = this.channel.id;
      if (!this.channel.isGroupChat) {
        this.directUser$ = this.userQuery.selectUserByChatUuid(this.channel.directChatUsers.otherUuid);
      }
      this.viewDate$ = this.channelHyperspaceQuery.selectUIState(this.channel.id, 'viewDate');
    }
  }

  editChannel() {
    // this.dialog.open(RenameConversationComponent, {
    //   width: '600px',
    //   data: this.channel
    // });
  }

  starConvo(channel: ChannelHyperspace) {
    this.starService.starChannelHyper(channel.id, channel.hyperspaceId).subscribe();
  }

  unstarConvo(channel: ChannelHyperspace) {
    this.starService.unstarChannelHyper(channel.id, channel.hyperspaceId).subscribe();
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

  editDescription() {
    this.dialog.open(EditDescriptionComponent, {
      width: '600px',
      data: this.channel
    });
  }
}
