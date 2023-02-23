import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AppQuery, AppService, ModeSidebar } from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { TxnCustom } from '../../sidebar.component';

@Component({
  selector: 'b3n-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss']
})
export class InboxComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() inbox: TxnCustom[];
  @Input() timeZone: string;
  @Input() isShowAllChannel: boolean;

  @Output() externalCountTop = new EventEmitter<number>();

  constructor(private appQuery: AppQuery, private appService: AppService) {
    super();
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inbox']) {
      this.externalCountTop.emit(this.inbox?.length);
    }
    if (changes['isShowAllChannel'] && this.isShowAllChannel) {
      this.externalCountTop.emit(0);
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

  trackByTxn(_, item: TxnCustom) {
    return item?.customerUuid;
  }
}
