import { Component, Input, OnInit } from '@angular/core';
import {
  ChannelHyperspaceQuery,
  ChannelHyperspaceService,
  HyperpsaceUI,
  Hyperspace,
  HyperspaceQuery,
  HyperspaceService,
  MappingHyperData,
  MeQuery
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { forkJoin, Observable } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-hyperspace',
  templateUrl: './hyperspace.component.html',
  styleUrls: ['./hyperspace.component.scss']
})
export class HyperspaceComponent extends DestroySubscriberComponent implements OnInit {
  @Input() hyper: Hyperspace;

  isExpand$: Observable<boolean>;
  countUnreadHyper$: Observable<number>;

  constructor(
    private hyperspaceQuery: HyperspaceQuery,
    private hyperspaceService: HyperspaceService,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private channelHyperspaceService: ChannelHyperspaceService,
    private meQuery: MeQuery
  ) {
    super();
  }

  ngOnInit() {
    this.isExpand$ = this.hyperspaceQuery.selectUIState(this.hyper.id, 'isExpand');
    this.countUnreadHyper$ = this.channelHyperspaceQuery.selectCountUnread(this.hyper.hyperspaceId);

    this.hyperspaceQuery
      .selectUIState(this.hyper.id, 'isExpand')
      .pipe(
        filter(isExpand => isExpand),
        take(1),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(() => {
        this.getChannel();
      });
  }

  toggleSection() {
    this.hyperspaceService.updateHyperspaceViewState(this.hyper.id, <HyperpsaceUI>{
      isExpand: !this.hyperspaceQuery.getUIState(this.hyper.id, 'isExpand')
    });
  }

  private getChannel() {
    const isLoadedMines = this.hyperspaceQuery.getUIState(this.hyper.id, 'loadedMines');
    if (!isLoadedMines) {
      forkJoin([
        this.channelHyperspaceService.getPublicChannels(this.hyper.hyperspaceId),
        this.channelHyperspaceService.getMines(this.hyper.hyperspaceId, <MappingHyperData>{
          meUuid: this.meQuery.getMe().userUuid,
          currentOrg: X.orgUuid
        })
      ]).subscribe(() => this.hyperspaceService.updateHyperspaceViewState(this.hyper.id, { loadedMines: true }));
    }
  }
}
