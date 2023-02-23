import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Pageable } from '@b3networks/api/common';
import { B3Number, FindNumberReq, NumberService } from '@b3networks/api/number';
import { Subscription, SubscriptionQuery } from '@b3networks/api/subscription';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'pos-view-number',
  templateUrl: './view-number.component.html',
  styleUrls: ['./view-number.component.scss']
})
export class ViewNumberComponent implements OnInit {
  @Output() backEvent: EventEmitter<void> = new EventEmitter();

  subscription: Subscription;
  keyword = new UntypedFormControl();
  loading = false;
  totalCount = 0;
  displayedColumns: string[] = [];
  pageable: Pageable = <Pageable>{ page: 1, perPage: 10 };
  data: B3Number[] = [];

  constructor(private numberService: NumberService, private subscriptionQuery: SubscriptionQuery) {}

  ngOnInit(): void {
    this.subscription = this.subscriptionQuery.getActive();
    this.findNumber();
    this.keyword.valueChanges.pipe(debounceTime(500)).subscribe(_ => {
      this.pageable.page = 1;
      this.findNumber();
    });
  }

  findNumber() {
    this.loading = true;
    const findNumberReq = new FindNumberReq({
      keyword: this.keyword.value,
      subscriptionUuids: [this.subscription.uuid],
      states: 'Assigned'
    });
    this.numberService.findNumbers(findNumberReq, this.pageable).subscribe(res => {
      this.loading = false;
      this.totalCount = res.totalCount;
      this.data = res.content;
    });
  }

  changePage(page?: number) {
    if (page > -1) {
      this.pageable.page = page;
    }
    this.findNumber();
  }

  back() {
    this.backEvent.emit();
  }
}
