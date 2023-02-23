import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  Channel,
  ChannelQuery,
  ChannelService,
  ChannelType,
  ChatMessage,
  IntegrationQuery,
  RequestSearchCriteria,
  UserQuery
} from '@b3networks/api/workspace';
import { HashMap } from '@datorama/akita';
import { isAfter, startOfDay, subDays, subMonths } from 'date-fns';
import { Observable, Subject } from 'rxjs';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { InfoShowMention, ModeSidebar } from '../../../core/state/app-state.model';
import { AppQuery } from '../../../core/state/app.query';
import { AppService } from '../../../core/state/app.service';
import { ConfigMessageOption } from '../../chat-message/chat-message.component';

export interface InputSearchDialog {
  key: string;
  channel: Channel;
  isPersonalBookmark: boolean;
}

const PAGE_LIMIT = 10;
const RANGE_MONTH = 3;
const RANGE_SEARCH_SERVER_DAYS = 10;

@Component({
  selector: 'b3n-search-dialog',
  templateUrl: './search-dialog.component.html',
  styleUrls: ['./search-dialog.component.scss']
})
export class SearchDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('inputSearch') inputSearch: ElementRef;

  // ui
  configMessageOption: ConfigMessageOption = {
    isHideAction: true,
    noHoverAffect: true,
    fullDate: true
  };
  loading: boolean;
  groupResult: Array<ChatMessage[]> = [];

  textSearch = this.fb.control('');

  form: Partial<RequestSearchCriteria>;
  key: UntypedFormControl = this.fb.control('');
  selectedCtr = this.fb.control([]);

  messageSelect$: Observable<ChatMessage>;

  lastFrom: number;
  hasRange: boolean;
  fetching: boolean;
  placeholder = 'Search keyword';

  loadingLoadMore: boolean;

  readonly RANGE_MONTH = RANGE_MONTH;

  private mapBookmark: HashMap<string> = {}; // extra messageId -> messageId
  private destroySubscriber$ = new Subject();
  private stopPollingSearch$ = new Subject();

  constructor(
    private fb: UntypedFormBuilder,
    private channelService: ChannelService,
    private channelQuery: ChannelQuery,
    private userQuery: UserQuery,
    private integrationQuery: IntegrationQuery,
    private elr: ElementRef,
    @Inject(MAT_DIALOG_DATA) public data: InputSearchDialog,
    private router: Router,
    public dialogRef: MatDialogRef<SearchDialogComponent>,
    private appQuery: AppQuery,
    private appService: AppService
  ) {
    this.placeholder = this.getChannelPlaceholder(this.data.channel);
  }

  ngOnInit() {
    const search = this.channelQuery.getChannelUiState(this.data.channel.id)?.search;
    if (search) {
      this.textSearch.setValue(search.keyword);
      this.key.setValue(search.keyword);
      this.form = search.form;
      this.lastFrom = search.lastFrom;
      this.hasRange = search.hasRange;
      this.groupResult = search.groupResult;
      this.selectedCtr.setValue([search.selectMsg]);
      this.mapBookmark = search.mapBookmark;
      this.loading = false;
    }

    setTimeout(() => {
      this.initForm();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inputSearch.nativeElement.focus();
    });
  }

  ngOnDestroy() {
    this.destroySubscriber$.next(true);
    this.destroySubscriber$.complete();

    this.stopPollingSearch$.next(true);
    this.stopPollingSearch$.complete();
  }

  compareObjects(a: ChatMessage, b: ChatMessage) {
    return a.id === b.id;
  }

  trackByMessage(_, msg: ChatMessage) {
    return msg.id;
  }

  trackByGroup(index: number, _) {
    return index;
  }

  onLoadContinue() {
    const lastSixMonth = startOfDay(subMonths(this.lastFrom, RANGE_MONTH));
    if (this.data.channel?.createdAt && !isAfter(lastSixMonth, new Date(this.data.channel?.createdAt))) {
      this.hasRange = false;
      this.form.fromMillis = new Date(this.data.channel?.createdAt).getTime();
    } else {
      this.hasRange = true;
      this.form.fromMillis = new Date(lastSixMonth).getTime();
    }

    const value = this.form;
    const fromMillis = subDays(this.lastFrom, RANGE_SEARCH_SERVER_DAYS).getTime();
    const req = <RequestSearchCriteria>{
      convoIDs: value.convoIDs,
      userIDs: value.userIDs || [],
      message: this.key.value,
      fromMillis: fromMillis >= value.fromMillis ? fromMillis : value.fromMillis,
      toMillis: this.lastFrom - 1,
      limit: PAGE_LIMIT
    };

    this.fetching = true;
    this.pollingSearch(req, fromMillis >= value.fromMillis);
  }

  onShowProfile(event: InfoShowMention) {
    this.appService.update({
      memberMenu: <InfoShowMention>{
        ...event,
        convo: this.data.channel
      }
    });
  }

  onMenuClosed() {
    const menu = this.elr.nativeElement.querySelector('.trigger-mention-menu') as HTMLElement;
    if (menu) {
      menu.style.display = 'none';
    }
  }

  private initForm() {
    this.key.valueChanges
      .pipe(
        filter(key => !!key),
        debounceTime(700)
      )
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe((key: string) => {
        this.stopPollingSearch$.next(true);
        this.resetDataSearch();

        this.groupResult = [];
        this.mapBookmark = {};
        const value = this.form;
        const fromMillis = subDays(value.toMillis, RANGE_SEARCH_SERVER_DAYS)?.getTime();
        const req = <RequestSearchCriteria>{
          convoIDs: value.convoIDs,
          userIDs: value.userIDs || [],
          message: key,
          fromMillis: fromMillis >= value.fromMillis ? fromMillis : value.fromMillis,
          toMillis: value.toMillis,
          limit: PAGE_LIMIT
        };
        this.loading = true;
        this.pollingSearch(req, fromMillis >= value.fromMillis);
      });

    this.selectedCtr.valueChanges.subscribe(value1 => {
      const selected: ChatMessage = value1[0];
      if (selected) {
        this.channelService.updateChannelViewState(this.data.channel.id, {
          search: {
            keyword: this.key.value,
            form: this.form,
            lastFrom: this.lastFrom,
            hasRange: this.hasRange,
            groupResult: this.groupResult,
            selectMsg: selected,
            mapBookmark: this.mapBookmark
          }
        });

        this.dialogRef.close();
        setTimeout(() => {
          const appQuery = this.appQuery.getValue();
          if (appQuery.modeRightSidebar === ModeSidebar.over && appQuery.showRightSidebar) {
            this.appService.update({
              showRightSidebar: false
            });

            setTimeout(() => {
              if (this.data.isPersonalBookmark) {
                this.navigateChannelWithMsg(this.data.channel.id, this.mapBookmark[selected.id]);
              } else {
                this.navigateChannelWithMsg(this.data.channel.id, selected.id);
              }
            }, 1000);
          } else {
            if (this.data.isPersonalBookmark) {
              this.navigateChannelWithMsg(this.data.channel.id, this.mapBookmark[selected.id]);
            } else {
              this.navigateChannelWithMsg(this.data.channel.id, selected.id);
            }
          }
        }, 50);
      }
    });
  }

  private navigateChannelWithMsg(id: string, msgId: string) {
    this.channelService.updateNavigateToMsg(id, msgId);
  }

  private resetDataSearch() {
    this.form = {
      toMillis: new Date().getTime(),
      fromMillis: subDays(new Date(), 7).getTime(),
      convoIDs: [],
      userIDs: []
    };

    this.form.convoIDs = [this.data.channel.id];
    const lastSixMonth = startOfDay(subMonths(new Date(), RANGE_MONTH));
    if (this.data.channel?.createdAt && !isAfter(lastSixMonth, new Date(this.data.channel?.createdAt))) {
      this.hasRange = false;
      this.form.fromMillis = new Date(this.data.channel?.createdAt).getTime();
    } else {
      this.hasRange = true;
      this.form.fromMillis = new Date(lastSixMonth).getTime();
    }
  }

  private pollingSearch(req: RequestSearchCriteria, isNext: boolean) {
    if (req.toMillis < req.fromMillis) {
      this.loading = false;
      this.fetching = false;
      return;
    }

    this.channelService
      .search(req)
      .pipe(takeUntil(this.stopPollingSearch$))
      .subscribe(
        result => {
          result.messages = result?.messages?.map(m => new ChatMessage(m));
          if (result.messages.length > 0) {
            if (this.data.isPersonalBookmark) {
              const arr: ChatMessage[] = [];
              result.messages.forEach(item => {
                const root = item.messageBookmark;
                if (root) {
                  arr.push(root);
                  this.mapBookmark[root.id] = item.id;
                }
              });
              this.groupResult.push(arr);
            } else {
              this.groupResult.push(result.messages);
            }
          }
          this.lastFrom = new Date(result.fromMillis).getTime();

          if (result.messages.length === req.limit) {
            req.toMillis = result.fromMillis - 1;
            if (req.toMillis > req.fromMillis) {
              this.pollingSearch(req, isNext);
            }
            return;
          }

          // 0 <= result.messages.length < limit
          if (!isNext) {
            this.loading = false;
            this.fetching = false;
            return;
          } else {
            const value = this.form;
            const fromMillis = subDays(this.lastFrom, RANGE_SEARCH_SERVER_DAYS).getTime();
            const reqNew = <RequestSearchCriteria>{
              ...req,
              fromMillis: fromMillis >= value.fromMillis ? fromMillis : value.fromMillis,
              toMillis: this.lastFrom - 1
            };
            this.pollingSearch(reqNew, fromMillis >= value.fromMillis);
          }
        },
        _ => {
          this.loading = false;
          this.fetching = false;
        }
      );
  }

  private getChannelPlaceholder(convo: Channel) {
    let placeholder: string;
    switch (convo.type) {
      case ChannelType.dm: {
        const directChatUsers =
          this.integrationQuery.getBotByChatUuid(convo.directChatUsers?.otherUuid) ||
          this.userQuery.getUserByChatUuid(convo.directChatUsers?.otherUuid);
        placeholder = `Search @${directChatUsers?.displayName || 'Unknown User'}`;
        break;
      }
      case ChannelType.gc:
        placeholder = `Search #${convo.displayName}`;
        break;
      default:
        placeholder = `Search ${convo.displayName}`;
        break;
    }
    return placeholder;
  }
}
