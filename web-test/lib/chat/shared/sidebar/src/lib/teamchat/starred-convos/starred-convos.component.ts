import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Optional,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import {
  Channel,
  ChannelHyperspaceService,
  ChannelService,
  ConvoType,
  HyperspaceQuery,
  IntegrationQuery,
  Privacy,
  StarService,
  User,
  UserQuery,
  UserStatus
} from '@b3networks/api/workspace';
import { AppQuery, AppService, ModeSidebar, UnifiedChannel, UNKNOWN_USER } from '@b3networks/chat/shared/core';
import { INJECT_PRODUCT_BUILD } from '@b3networks/shared/common';

@Component({
  selector: 'b3n-starred-convos',
  templateUrl: './starred-convos.component.html',
  styleUrls: ['./starred-convos.component.scss']
})
export class StarredConvosComponent implements OnInit, OnChanges {
  readonly Privacy = Privacy;
  readonly UserStatus = UserStatus;
  readonly UNKNOWN_USER = UNKNOWN_USER;
  readonly ConvoType = ConvoType;

  @Input() channelCs: UnifiedChannel[];
  @Input() channelDMs: UnifiedChannel[];
  @Output() dmStarCount = new EventEmitter<number>();
  @Output() csStarCount = new EventEmitter<number>();

  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;

  contextMenuPosition = { x: '0px', y: '0px' };

  constructor(
    private userQuery: UserQuery,
    private integrationQuery: IntegrationQuery,
    private hyperspaceQuery: HyperspaceQuery,
    private channelService: ChannelService,
    private channelHyperspaceService: ChannelHyperspaceService,
    private starService: StarService,
    private appService: AppService,
    private appQuery: AppQuery,
    @Optional() @Inject(INJECT_PRODUCT_BUILD) private production
  ) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['channelCs'] && this.channelCs?.length > 0) {
      this.channelCs = this.channelCs.filter(c => c.isStarred);

      setTimeout(() => {
        this.csStarCount.emit(this.channelCs.length);
      });
    }

    if (changes['channelDMs'] && this.channelDMs?.length > 0) {
      this.channelDMs = this.sortDMBy(this.channelDMs.filter(c => c.isStarred));

      setTimeout(() => {
        this.dmStarCount.emit(this.channelDMs.length);
      });
    }
  }

  trackByFn(index, item) {
    return item.id;
  }

  closeSidebar($event) {
    $event.stopPropagation();
    const mode = this.appQuery.getValue()?.modeLeftSidebar;
    if (mode === ModeSidebar.over) {
      setTimeout(() => {
        this.appService.update({
          showLeftSidebar: false
        });
      }, 50);
    }
  }

  onContextMenu(event: MouseEvent, convo: Channel) {
    if (this.production) {
      event.preventDefault();
      this.contextMenuPosition.x = event.clientX + 'px';
      this.contextMenuPosition.y = event.clientY + 'px';
      this.contextMenu.menuData = { convo: convo };
      this.contextMenu.menu.focusFirstItem('mouse');
      this.contextMenu.openMenu();
    }
  }

  starConvo($event, convo: UnifiedChannel) {
    $event.stopPropagation();
    if (!convo.hyperspaceId) {
      this.starService.starChannelTeamChat(convo.id).subscribe();
    } else {
      this.starService.starChannelHyper(convo.id, convo.hyperspaceId).subscribe();
    }
  }

  unstarConvo($event, convo: UnifiedChannel) {
    $event.stopPropagation();
    if (!convo.hyperspaceId) {
      this.starService.unstarChannelTeamChat(convo.id).subscribe();
    } else {
      this.starService.unstarChannelHyper(convo.id, convo.hyperspaceId).subscribe();
    }
  }

  private sortDMBy(channel: UnifiedChannel[]) {
    const mapping: {
      convos: UnifiedChannel;
      user: User;
    }[] = channel
      .map(c => {
        let user: any = this.userQuery.getUserByChatUuid(c.userUuidDirectChat);
        if (!user) {
          user = this.integrationQuery.getBotByChatUuid(c.userUuidDirectChat);
        }

        return {
          convos: c,
          user: !c.hyperspaceId
            ? user
            : this.hyperspaceQuery
                .getHyperByHyperspaceId(c.hyperspaceId)
                ?.allMembers?.find(x => x.userUuid === c.userUuidDirectChat)
        };
      })
      .filter(x => !!x.user);

    return mapping
      .sort((a, b) => {
        return (
          b.user?.status?.toString().localeCompare(a.user?.status?.toString()) ||
          a.user?.displayName?.localeCompare(b.user?.displayName)
        );
      })
      .map(x => x.convos);
  }
}
