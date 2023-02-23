import { Component, Input, OnInit } from '@angular/core';
import { RecoveryResponseV2 } from '@b3networks/api/subscription';

@Component({
  selector: 'b3n-finish',
  templateUrl: './finish.component.html',
  styleUrls: ['./finish.component.scss']
})
export class FinishComponent implements OnInit {
  displayedColumns: string[] = ['subscriptions', 'status'];

  @Input() subscriptionsSelected: RecoveryResponseV2[] = [];
  @Input() orgUuid: string;
  @Input() recoverUuid: string;

  constructor() {}

  ngOnInit(): void {}

  getRecoveryLink() {
    return location.origin + `#/${this.orgUuid}/renewSubscription/${this.recoverUuid}`;
  }
}
