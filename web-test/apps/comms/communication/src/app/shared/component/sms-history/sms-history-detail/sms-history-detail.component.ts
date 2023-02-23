import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UnifiedSMSHistory } from '@b3networks/api/data';
import { DestroySubscriberComponent } from '@b3networks/shared/common';

@Component({
  selector: 'b3n-sms-history-detail',
  templateUrl: './sms-history-detail.component.html',
  styleUrls: ['./sms-history-detail.component.scss']
})
export class SMSHistoryDetailComponent extends DestroySubscriberComponent {
  @Input() history: UnifiedSMSHistory;
  @Output() closeSidenav = new EventEmitter();

  constructor() {
    super();
  }

  close() {
    this.closeSidenav.emit();
  }
}
