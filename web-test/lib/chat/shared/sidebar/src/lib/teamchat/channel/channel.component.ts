import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { ChannelHyperspaceService, ChannelService, Privacy, StarService } from '@b3networks/api/workspace';
import { AppQuery, AppService, ModeSidebar, UnifiedChannel } from '@b3networks/chat/shared/core';

@Component({
  selector: 'b3n-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.scss']
})
export class ChannelComponent implements OnChanges, OnDestroy {
  readonly Privacy = Privacy;

  @Input() isShowAllChannel: boolean; // only show if has mention > 0 or direct-chat
  @Input() hasMention: boolean;
  @Input() channelCs: UnifiedChannel[];

  @Output() csNotStarCountTop = new EventEmitter<number>();
  @Output() csNotStarCountBottom = new EventEmitter<number>();

  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;

  contextMenuPosition = { x: '0px', y: '0px' };

  constructor(
    private channelService: ChannelService,
    private channelHyperspaceService: ChannelHyperspaceService,
    private starService: StarService,
    private appService: AppService,
    private appQuery: AppQuery
  ) {}

  ngOnDestroy(): void {
    if (this.isShowAllChannel && this.hasMention) {
      this.csNotStarCountTop.emit(0);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['channelCs'] && this.channelCs?.length > 0) {
      this.channelCs = this.channelCs.filter(c => {
        const check = this.isShowAllChannel
          ? true
          : this.hasMention
          ? c?.mentionCount > 0
          : !c?.mentionCount || c.mentionCount === 0;
        return !c.isStarred && check;
      });

      setTimeout(() => {
        if (this.isShowAllChannel) {
          this.csNotStarCountBottom.emit(this.channelCs.length);
        } else {
          if (this.hasMention) {
            this.csNotStarCountTop.emit(this.channelCs.length);
          } else {
            this.csNotStarCountBottom.emit(this.channelCs.length);
          }
        }
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
}
