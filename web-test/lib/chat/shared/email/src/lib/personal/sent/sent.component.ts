import { Component, EventEmitter, OnInit } from '@angular/core';
import { ChatMessage, EmailSearchCriteria, MessageSearchResult } from '@b3networks/api/workspace';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { EmailConversationListAbstractComponent } from '../../shared/list/email-conversation-list-abstract.component';

const MAX_SEARCH_HOUR = 168;

@UntilDestroy()
@Component({
  selector: 'b3n-sent',
  templateUrl: './sent.component.html',
  styleUrls: ['./sent.component.scss']
})
export class SentComponent extends EmailConversationListAbstractComponent implements OnInit {
  PAGE_LIMIT = 10;
  MIN_DATE_SEARCH = new Date(2018, 6, 1, 0, 0, 0, 0); // launch production on this date
  page = 0;

  advanceSearch = true;
  criteria: EmailSearchCriteria = <EmailSearchCriteria>{
    fromDate: new Date(),
    toDate: new Date()
  };

  selected = 0;
  searchResult: MessageSearchResult;

  onSearching: EventEmitter<any> = new EventEmitter();
  finishSearch = true;
  multipleRequest = false;

  lastFromMillis: number;
  hasMore = false;
  cancel = false;

  displayMessages: ChatMessage[] = [];

  getConversations() {}

  override init() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    this.criteria.fromDate = sevenDaysAgo;
    this.onSearching
      .pipe(
        switchMap(() => {
          this.searchResult = <MessageSearchResult>{};
          this.page = 0;
          this.finishSearch = false;
          this.clearMessage();
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
            'sent'
          );
        }),
        catchError(() => {
          return of(<MessageSearchResult>{
            messages: []
          });
        })
      )
      .subscribe(data => {
        this.finishSearch = true;
        this.searchResult = data;
        this.appendResult(data.messages);

        if (this.searchResult.count < this.searchResult.total) {
          this.lastFromMillis = this.searchResult.fromMillis;
        } else if (this.searchResult.count < this.PAGE_LIMIT && this.multipleRequest) {
          this.loadMore();
        }
      });

    this.onSearching.emit();
  }

  loadMore(newPage: boolean = false) {
    if (this.cancel) {
      return;
    }

    if (newPage) {
      this.page++;
    }
    // load until time start app
    if (this.lastFromMillis <= this.MIN_DATE_SEARCH.getTime()) {
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
      .searchEmailConversation(this.criteria.keyword, fromDate, toDate, this.PAGE_LIMIT, 'sent')
      .pipe(untilDestroyed(this))
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

        this.appendResult(result.messages);

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

  toggleSearchMode() {
    this.advanceSearch = !this.advanceSearch;

    if (!this.advanceSearch) {
      this.criteria.conversations = [];
      this.criteria.users = [];
      this.criteria.fromDate = null;
      this.criteria.toDate = null;
    }
  }

  clear() {
    this.criteria.keyword = '';
    this.hasMore = false;
    this.clearMessage();
  }

  criteriaChanged(criteria: EmailSearchCriteria) {
    const keyword = this.criteria.keyword;
    this.criteria = criteria;
    this.criteria.keyword = keyword;
    this.onSearching.emit();
  }

  private clearMessage() {
    this.displayMessages = [];
  }

  private appendResult(messages: ChatMessage[]) {
    if (messages.length) {
      messages.forEach(message => {
        this.displayMessages.push(new ChatMessage(message));
      });
    }
  }

  trackBy(index: number) {
    return index;
  }
}
