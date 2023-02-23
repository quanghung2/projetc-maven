import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import {
  Channel,
  ChannelQuery,
  ChannelService,
  ChannelType,
  ChatMessage,
  ConfigStore,
  FilterConvoMessageRangeRequest,
  HistoryMessageService,
  MeQuery,
  MsgType,
  Privacy,
  User,
  UserQuery
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { format } from 'date-fns';
import { fromEvent, Observable, Subject } from 'rxjs';
import { debounceTime, filter, finalize, map, share, takeUntil } from 'rxjs/operators';
import { InfoShowMention } from '../../../../core/state/app-state.model';

const DEFAULT_LIMIT = 50;

@Component({
  selector: 'b3n-preview-history',
  templateUrl: './preview-history.component.html',
  styleUrls: ['./preview-history.component.scss']
})
export class PreviewHistoryComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('viewport', { static: false }) viewport: ElementRef | null;
  @ViewChild(MatMenuTrigger) renderMenuComp: MatMenuTrigger;

  @Input() message: ChatMessage;
  @Input() channel: Channel;

  @Output() back = new EventEmitter();
  @Output() onShowProfileMention = new EventEmitter<InfoShowMention>();

  directUser$: Observable<User>; // direct chat user
  messages: ChatMessage[] = [];

  // ui for convo
  ui: {
    loading: boolean;
    hasMoreTop: boolean;
    hasMoreBottom: boolean;
    viewDate: number;
  } = {
    loading: false,
    hasMoreTop: false,
    hasMoreBottom: false,
    viewDate: null
  };

  // loadmore
  isLoadingMoreBackward: boolean;
  isLoadingMoreForward: boolean;

  private destroyConvo$ = new Subject();

  readonly MsgType = MsgType;
  readonly ChannelType = ChannelType;
  readonly Privacy = Privacy;

  constructor(
    private historyMessageService: HistoryMessageService,
    private meQuery: MeQuery,
    public elr: ElementRef,
    private channelQuery: ChannelQuery,
    private channelService: ChannelService,
    private userQuery: UserQuery
  ) {
    super();
  }

  ngOnInit(): void {
    if (this.channel.directChatUsers) {
      this.directUser$ = this.userQuery.selectUserByChatUuid(this.channel.directChatUsers.otherUuid);
    }
    this.getHistory();

    if (!this.channelQuery.getEntity(this.message.convo)) {
      this.channelService.getDetails(this.message.convo, this.meQuery.getMe().userUuid).subscribe();
    }
  }

  override destroy(): void {
    this.destroyConvo$.complete();
  }

  goBack() {
    this.back.emit(true);
  }

  trackByIdx(_: number, message: ChatMessage) {
    return message.clientId;
  }

  onShowProfile(event: InfoShowMention) {
    this.onShowProfileMention.emit(event);
  }

  setDisplayDate(timestamp: number): string {
    const current = new Date(timestamp).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (current === today) {
      return 'Today';
    }
    if (current === yesterday.setHours(0, 0, 0, 0)) {
      return 'Yesterday';
    }
    return format(current, 'EEEE, MMMM do');
  }

  private getHistory() {
    this.ui.loading = true;
    this.historyMessageService
      .getChannelRangeHistory(
        <FilterConvoMessageRangeRequest>{
          convoId: this.channel.id,
          limit: 1,
          from: this.message.id,
          to: this.message.id,
          fromInclusive: true,
          toInclusive: true,
          beforeFromSize: 30,
          afterToSize: 30,
          isAsc: true
        },
        {
          isNoStore: true,
          noLoading: true
        }
      )
      .pipe(finalize(() => (this.ui.loading = false)))
      .subscribe(history => {
        this.messages = history.messages;
        const index = history.messages.findIndex(x => x.id === this.message.id);
        this.ui.hasMoreTop = index !== 0;
        this.ui.hasMoreBottom = index < history.messages.length - 1;
        this.scrollToMessage(this.message.id);
        setTimeout(() => {
          this.registerScrollEvent();
        });
      });
  }

  private scrollToMessage(id: string, count = 0) {
    const array: HTMLDivElement[] = Array.from(this.viewport.nativeElement.querySelectorAll('.msg-item'));

    const $el = array.find(e => e.id === id);
    if ($el) {
      setTimeout(() => {
        $el.scrollIntoView({
          block: 'start'
        });
      }, 0);
    } else {
      count++;
      if (count < 50) {
        // retry
        setTimeout(() => {
          this.scrollToMessage(id, count);
        }, 10);
      }
    }
  }

  private registerScrollEvent() {
    if (this.viewport) {
      const onViewportScroll$ = fromEvent<Event>(this.viewport.nativeElement, 'scroll').pipe(
        map((event: Event) => event.target['scrollTop'].valueOf()),
        share()
      );
      setTimeout(() => {
        onViewportScroll$
          .pipe(takeUntil(this.destroyConvo$), debounceTime(200))
          .pipe(
            filter(_ => !!this.viewport),
            takeUntil(this.destroyConvo$)
          )
          .subscribe(value => {
            const array: HTMLDivElement[] = Array.from(this.viewport.nativeElement.querySelectorAll('.msg-item'));
            this.ui.viewDate = this.findViewDateFirstMessage(array, value);
          });

        // load to prepend or append
        onViewportScroll$.pipe(debounceTime(40), takeUntil(this.destroyConvo$)).subscribe(value => {
          if (!this.isLoadingMoreBackward && value < 30) {
            // prepend
            this.isLoadingMoreBackward = true;
            this.loadMoreTop();
          } else if (!this.isLoadingMoreForward && value === this.getMaxScrollTopViewportValue()) {
            // append
            this.isLoadingMoreForward = true;
            this.loadMoreBottom();
          }
        });
      }, 200);
    } else {
      setTimeout(() => {
        this.registerScrollEvent();
      }, 100);
    }
  }

  private findViewDateFirstMessage(array: HTMLDivElement[], topOffset: number) {
    let viewDate = Date.parse(new Date().toString());
    if (array.length > 0) {
      const itemFirstViewed = array.find((msg: HTMLDivElement) => {
        return msg.offsetTop + msg.clientHeight >= topOffset;
      });
      if (itemFirstViewed) {
        viewDate = +itemFirstViewed.getAttribute('data-ts');
      } else {
        viewDate = +array[0].getAttribute('data-ts');
      }
    }
    return viewDate;
  }

  private loadMoreTop() {
    if (this.ui.hasMoreTop) {
      this.ui.loading = true;
      const msgFirst = this.messages[0];
      this.historyMessageService
        .getChannelRangeHistory(
          <FilterConvoMessageRangeRequest>{
            convoId: msgFirst.convo,
            limit: DEFAULT_LIMIT,
            from: undefined,
            to: msgFirst.id,
            fromInclusive: false,
            toInclusive: false,
            beforeFromSize: 0,
            afterToSize: 0,
            isAsc: false
          },
          {
            isNoStore: true,
            noLoading: true
          }
        )
        .pipe(
          finalize(() => {
            this.ui.loading = false;
            this.isLoadingMoreBackward = false;
          })
        )
        .subscribe(history => {
          if (history.messages.length > 0) {
            this.messages = [...history.messages.reverse(), ...this.messages];
            this.scrollToMessage(msgFirst.id);
          }
          this.ui.hasMoreTop = history.messages.length !== 0;
        });
    }
  }

  private loadMoreBottom() {
    if (this.ui.hasMoreBottom) {
      this.ui.loading = true;
      const msgLast = this.messages[this.messages.length - 1];
      this.historyMessageService
        .getChannelRangeHistory(
          <FilterConvoMessageRangeRequest>{
            convoId: msgLast.convo,
            limit: DEFAULT_LIMIT,
            from: msgLast.id,
            to: undefined,
            fromInclusive: false,
            toInclusive: false,
            beforeFromSize: 0,
            afterToSize: 0,
            isAsc: true
          },
          <ConfigStore>{
            isNoStore: true,
            noLoading: true
          }
        )
        .pipe(
          finalize(() => {
            this.isLoadingMoreForward = false;
            this.ui.loading = false;
          })
        )
        .subscribe(history => {
          if (history.messages.length > 0) {
            this.messages = [...this.messages, ...history.messages];
            this.scrollToMessage(msgLast.id);
          }
          this.ui.hasMoreBottom = history.messages.length !== 0;
        });
    }
  }

  private getMaxScrollTopViewportValue() {
    return this.viewport?.nativeElement.scrollHeight - this.viewport?.nativeElement.clientHeight;
  }
}
