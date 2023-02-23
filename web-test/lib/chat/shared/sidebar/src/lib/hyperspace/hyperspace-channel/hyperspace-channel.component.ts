import { Component, Input, OnInit } from '@angular/core';
import { ChannelHyperspace, ChannelHyperspaceQuery, ChannelType, Privacy } from '@b3networks/api/workspace';
import { AppQuery, AppService, ModeSidebar } from '@b3networks/chat/shared/core';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'b3n-hyperspace-channel',
  templateUrl: './hyperspace-channel.component.html',
  styleUrls: ['./hyperspace-channel.component.scss']
})
export class HyperspaceChannelComponent implements OnInit {
  @Input() hyperspaceId: string;

  channels$: Observable<ChannelHyperspace[]>;

  readonly Privacy = Privacy;
  readonly ChannelType = ChannelType;

  constructor(
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private appService: AppService,
    private appQuery: AppQuery
  ) {}

  ngOnInit(): void {
    this.channels$ = this.channelHyperspaceQuery.selectChannelByUser(this.hyperspaceId).pipe(
      debounceTime(10),
      map(channels =>
        channels.map(
          c =>
            new ChannelHyperspace({
              ...c,
              isDraft$: this.channelHyperspaceQuery.selectUIState(c.id, 'draftMsg').pipe(
                map(d => !!d),
                distinctUntilChanged()
              )
            })
        )
      )
    );
  }

  trackByFn(index, item: ChannelHyperspace) {
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
}
