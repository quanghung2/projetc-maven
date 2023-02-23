import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DashboardV2Service, QuestionV2 } from '@b3networks/api/dashboard';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { takeUntil, tap } from 'rxjs/operators';
import { WidgetData } from '../model/widget.model';
import { UserState } from './user-state-widget.model';

@Component({
  selector: 'b3n-user-state-widget',
  templateUrl: './user-state-widget.component.html',
  styleUrls: ['./user-state-widget.component.scss']
})
export class UserStateWidgetComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() questionV2: QuestionV2;
  @Input() data: WidgetData;

  userStates: UserState[] = [];
  userStatesFilter: UserState[] = [];
  extensionKeys: string[] = [];
  keys = Object.keys;

  constructor(private dashboardV2Service: DashboardV2Service) {
    super();
  }

  ngOnInit() {
    this.dashboardV2Service.extensionKeys$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(extensionKeys => {
          this.extensionKeys = extensionKeys;

          if (!this.userStates?.length) {
            return;
          }

          this.userStatesFilter = this.userStates.filter(state => this.extensionKeys?.includes(state.extensionKey));
        })
      )
      .subscribe();
  }

  ngOnChanges(change: SimpleChanges) {
    if (
      !change['data'] ||
      !change['data'].currentValue ||
      !change['data'].currentValue.datasets ||
      !change['data'].currentValue.datasets.length ||
      !(change['data'].currentValue.datasets[0] as any).data ||
      !(change['data'].currentValue.datasets[0] as any).data.rows
    ) {
      return;
    }

    this.userStates = (change['data'].currentValue.datasets[0] as any).data.rows.map(
      row => new UserState({ ...row, userStateMap: this.questionV2.config })
    );
    this.userStatesFilter = this.userStates.filter(state => this.extensionKeys.includes(state.extensionKey));
  }
}
