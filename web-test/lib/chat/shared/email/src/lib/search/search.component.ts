import { Component, EventEmitter, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { EmailSearchResultComponent } from './search-result/search-result.component';
import {
  ChatMessage,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  HistoryMessageService,
  MeQuery,
  MessageSearchResult,
  EmailSearchCriteria,
  User,
  UserQuery
} from '@b3networks/api/workspace';
import { Observable, of } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { UntypedFormControl } from '@angular/forms';
import { EmailConversationDetailComponent } from '../shared/email-conversation-detail/email-conversation-detail.component';

const MAX_SEARCH_HOUR = 168;
const LAUNCH_PRODUCTION_DATE = new Date(2018, 6, 1, 0, 0, 0, 0);

@Component({
  selector: 'b3n-email-search-dialog',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
  PAGE_LIMIT = 10;
  @ViewChild(EmailSearchResultComponent, { static: false }) resultComponent: EmailSearchResultComponent;
  @ViewChild(EmailConversationDetailComponent, { static: false })
  conversationDetailComponent: EmailConversationDetailComponent;

  page = 0;

  criteria: EmailSearchCriteria = <EmailSearchCriteria>{
    fromDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    toDate: new Date()
  };
  searchField: UntypedFormControl = new UntypedFormControl();

  selected = 0;
  loading = false;
  searchResult: MessageSearchResult;

  onSearching: EventEmitter<any> = new EventEmitter();
  finishSearch = true;
  multipleRequest = false;

  lastFromMillis: number;
  hasMore = false;
  cancel = false;

  viewMode: ViewMode = ViewMode.search;
  users: User[] = [];
  me: User;
  selectedMessages: ChatMessage[] = [];
  conversations: ConversationGroup[] = [];
  conversationGroupObservable$: Observable<ConversationGroup>;
  convoLoading$: Observable<boolean> = new Observable<boolean>();

  constructor(
    private conversationGroupService: ConversationGroupService,
    private userQuery: UserQuery,
    private meQuery: MeQuery,
    private historyMessageService: HistoryMessageService,
    private conversationGroupQuery: ConversationGroupQuery
  ) {}

  ngOnInit() {
    this.convoLoading$ = this.conversationGroupQuery.loading$;
    this.userQuery.users$.subscribe(users => (this.users = users));
    this.meQuery.me$.subscribe(me => (this.me = me));
    this.conversationGroupQuery
      .selectEmailConversation()
      .pipe(
        filter(convos => !!convos.length),
        take(1)
      )
      .subscribe(convos => {
        this.conversations = convos;
      });

    this.onSearching
      .pipe(
        switchMap(() => {
          this.searchResult = <MessageSearchResult>{};
          this.loading = true;
          this.page = 0;
          this.finishSearch = false;
          this.resultComponent.clearMessage();
          this.hasMore = true;

          const to = this.criteria.toDate.setDate(this.criteria.toDate.getDate() + 1);
          let from = this.criteria.fromDate.getTime();

          if (from <= to - MAX_SEARCH_HOUR * 60 * 60 * 1000) {
            from = to - MAX_SEARCH_HOUR * 60 * 60 * 1000 + 1;
            this.multipleRequest = true;
          } else {
            this.multipleRequest = false;
          }

          this.lastFromMillis = from;

          return this.conversationGroupService.searchEmailConversation(
            this.criteria.keyword,
            from,
            to,
            this.PAGE_LIMIT,
            'search'
          );
        }),
        catchError(() => {
          this.loading = false;
          return of(<MessageSearchResult>{
            messages: []
          });
        })
      )
      .subscribe(data => {
        this.loading = false;
        this.finishSearch = true;
        this.searchResult = data;
        this.resultComponent.appendResult(data.messages);

        if (this.searchResult.count < this.searchResult.total) {
          this.lastFromMillis = this.searchResult.fromMillis;
        } else if (this.searchResult.count < this.PAGE_LIMIT && this.multipleRequest) {
          this.loadMore();
        }
      });
  }

  ngOnDestroy() {
    this.cancel = true;
  }

  loadMore(newPage: boolean = false) {
    if (this.cancel) {
      return;
    }

    if (newPage) {
      this.page++;
    }

    // load until time start app
    if (this.lastFromMillis <= LAUNCH_PRODUCTION_DATE.getTime()) {
      this.finishSearch = true;
      this.hasMore = false;
      return;
    }

    const toDate = this.lastFromMillis;
    const minDate = this.criteria.fromDate.getTime();
    const lastFromMillisDate = new Date(this.lastFromMillis);
    let fromDate = lastFromMillisDate.setHours(lastFromMillisDate.getHours() - MAX_SEARCH_HOUR);

    this.finishSearch = false;
    const lastRequest = minDate >= fromDate;
    if (lastRequest) {
      fromDate = minDate;
    }

    this.lastFromMillis = fromDate;

    this.conversationGroupService
      .searchEmailConversation(this.criteria.keyword, fromDate, toDate, this.PAGE_LIMIT, 'search')
      .subscribe(result => {
        if (result.total > 0) {
          result.messages.forEach(x => {
            this.searchResult.messages.push(x);
            this.searchResult.count += 1;
            this.searchResult.total += 1;
          });
        }

        if (result.total > result.count) {
          this.lastFromMillis = result.fromMillis;
          this.finishSearch = true;
        } else {
          this.lastFromMillis = fromDate;
        }

        this.resultComponent.appendResult(result.messages);

        if (lastRequest && result.total === result.count) {
          this.hasMore = false;
          this.finishSearch = true;
        }

        if (this.searchResult.count < (this.page + 1) * this.PAGE_LIMIT && !lastRequest) {
          this.loadMore();
        } else {
          this.finishSearch = true;
        }
      });
  }

  clear() {
    this.criteria.keyword = '';
    this.hasMore = false;
    this.resultComponent.clearMessage();
  }

  search() {
    if (this.criteria.keyword) {
      this.onSearching.emit();
    }
  }

  criteriaChanged(criteria: EmailSearchCriteria) {
    const keyword = this.criteria.keyword;

    this.criteria = criteria;
    this.criteria.keyword = keyword;

    this.onSearching.emit();
  }

  changeMode(viewMode) {
    this.viewMode = viewMode;
  }

  onViewHistory(convoId: string) {
    this.viewMode = ViewMode.history;
    this.conversationGroupObservable$ = this.conversationGroupService.getConversationDetail(
      convoId,
      this.me.userUuid,
      true
    );
  }
}

enum ViewMode {
  search = 'search',
  history = 'history'
}
