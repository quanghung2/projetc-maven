import { Component, Input, OnInit } from '@angular/core';
import { IdentityProfileQuery, OrganizationPolicyQuery } from '@b3networks/api/auth';
import { MeQuery as LicenseMeQuery } from '@b3networks/api/license';
import { MemberRole } from '@b3networks/api/member';
import {
  ChannelHyperspaceService,
  ChatService,
  Hyperspace,
  HyperspaceQuery,
  HyperspaceService,
  MappingHyperData,
  MeQuery,
  SocketStatus
} from '@b3networks/api/workspace';
import { AppQuery, AppService, ModeSidebar, UnifiedChannel } from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { combineLatest, forkJoin, of } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { TxnCustom } from '../sidebar.component';

interface PersonalChannelInfo {
  icon: string;
  channel: UnifiedChannel;
}

@Component({
  selector: 'b3n-teamchat',
  templateUrl: './teamchat.component.html',
  styleUrls: ['./teamchat.component.scss']
})
export class TeamchatComponent extends DestroySubscriberComponent implements OnInit {
  @Input() isShowAllChannel: boolean;
  @Input() hasTeamChatLicense: boolean;
  @Input() hasExtCallcenter: boolean;
  @Input() timeZone: string;
  @Input() channelCs: UnifiedChannel[] = [];
  @Input() channelDMs: UnifiedChannel[] = [];
  @Input() channelPersonals: UnifiedChannel[] = [];
  @Input() inbox: TxnCustom[] = [];
  @Input() inboxV2: TxnCustom[] = [];

  count = {
    external: 0,
    dmStar: 0,
    csStar: 0,
    dmNotStar: 0,
    csNotStarTop: 0,
    csNotStarBottom: 0,
    hasInit: false
  };

  constructor(
    private hyperspaceQuery: HyperspaceQuery,
    private hyperspaceService: HyperspaceService,
    private channelHyperspaceService: ChannelHyperspaceService,
    private identityProfileQuery: IdentityProfileQuery,
    private meQuery: MeQuery,
    private chatService: ChatService,
    private licenseMeQuery: LicenseMeQuery,
    private orgPolicyQuery: OrganizationPolicyQuery,
    private appService: AppService,
    private appQuery: AppQuery
  ) {
    super();
  }

  ngOnInit() {
    this.chatService.socketStatus$
      .pipe(
        filter(s => s != null && s === SocketStatus.opened),
        takeUntil(this.destroySubscriber$),
        take(1)
      )
      .subscribe(_ => {
        combineLatest([this.meQuery.me$, this.identityProfileQuery.roleCurrentOrg$])
          .pipe(
            filter(([me, role]) => me != null && role != null),
            take(1),
            takeUntil(this.destroySubscriber$)
          )
          .subscribe(([me, role]) => {
            const selectHasHyperspacesByUser$ =
              role === MemberRole.OWNER ? of(true) : this.hyperspaceQuery.selectHasHyperspacesByUser(me.identityUuid);

            selectHasHyperspacesByUser$.pipe(takeUntil(this.destroySubscriber$)).subscribe(hasHyper => {
              if (hasHyper) {
                this.hyperspaceQuery
                  .selectHyperspaceByUser(me.identityUuid)
                  .pipe(takeUntil(this.destroySubscriber$))
                  .subscribe(hypers => {
                    hypers.forEach(hyper => this.getChannel(hyper));
                  });
              }
            });
          });
      });
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

  private getChannel(hyperspace: Hyperspace) {
    const isLoadedMines = this.hyperspaceQuery.getUIState(hyperspace.id, 'loadedMines');
    if (!isLoadedMines) {
      forkJoin([
        this.channelHyperspaceService.getPublicChannels(hyperspace.hyperspaceId),
        this.channelHyperspaceService.getMines(hyperspace.hyperspaceId, <MappingHyperData>{
          meUuid: this.meQuery.getMe().userUuid,
          currentOrg: X.orgUuid
        })
      ]).subscribe(() => this.hyperspaceService.updateHyperspaceViewState(hyperspace.id, { loadedMines: true }));
    }
  }
}
