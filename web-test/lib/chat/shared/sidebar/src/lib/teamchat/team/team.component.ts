import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { HyperspaceQuery, IntegrationQuery, StarService, User, UserQuery, UserStatus } from '@b3networks/api/workspace';
import { AppQuery, AppService, ModeSidebar, UnifiedChannel, UNKNOWN_USER } from '@b3networks/chat/shared/core';

@Component({
  selector: 'b3n-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit, OnChanges {
  @Input() channelDMs: UnifiedChannel[];
  @Output() dmNotStarCount = new EventEmitter<number>();

  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;

  contextMenuPosition = { x: '0px', y: '0px' };

  readonly UserStatus = UserStatus;
  readonly UNKNOWN_USER = UNKNOWN_USER;

  constructor(
    private userQuery: UserQuery,
    private integrationQuery: IntegrationQuery,
    private hyperspaceQuery: HyperspaceQuery,
    private starService: StarService,
    private appService: AppService,
    private appQuery: AppQuery
  ) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['channelDMs'] && this.channelDMs?.length > 0) {
      this.channelDMs = this.sortDMBy(this.channelDMs.filter(c => !c.isStarred));

      setTimeout(() => {
        this.dmNotStarCount.emit(this.channelDMs.length);
      });
    }
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

  trackByFn(index, item) {
    return item.id;
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
