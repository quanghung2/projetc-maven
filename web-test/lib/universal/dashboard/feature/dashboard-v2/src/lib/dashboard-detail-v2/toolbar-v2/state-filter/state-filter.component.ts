import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { ConfigPieV2, DashboardV2Service, QuestionV2SourceFilter, STATE_WIDTH } from '@b3networks/api/dashboard';
import { DashboardV2AppSettingFilter } from '@b3networks/api/portal';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { HashMap } from '@datorama/akita';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-state-filter',
  templateUrl: './state-filter.component.html',
  styleUrls: ['./state-filter.component.scss']
})
export class StateFilterComponent extends DestroySubscriberComponent implements OnInit {
  @Input() form: UntypedFormGroup;
  @Input() storedFilter: DashboardV2AppSettingFilter;
  @ViewChild('stateSelect') stateSelect: MatSelect;

  hasStateFilterV2: boolean;
  selectAllStates = true;
  states: string[] = [];
  userStateMap: HashMap<ConfigPieV2> = {};

  constructor(private dashboardV2Service: DashboardV2Service, private cdr: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {
    this.statesFC.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(states => {
          const stateSelectValue = this.stateSelect?.value;

          if (states && stateSelectValue && states.length !== stateSelectValue.length) {
            this.statesFC.setValue(states);
            return;
          }

          this.selectAllStates = states?.length === this.states.length;
          this.dashboardV2Service.states$.next(states);
        })
      )
      .subscribe();

    this.dashboardV2Service.userStateMap$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(userStateMap => {
          const isNotEmpty = !!this.states.length;

          this.userStateMap = userStateMap;
          this.states = Object.keys(userStateMap).sort((a, b) =>
            userStateMap[a]?.displayText?.localeCompare(userStateMap[b]?.displayText)
          );

          if (!isNotEmpty) {
            this.handleStatesFilter();
          }
        })
      )
      .subscribe();
  }

  handleStatesFilter() {
    this.dashboardV2Service.stateFilterHash$$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(stateFilterHash => {
          this.checkHasStateFilterV2(stateFilterHash);
        })
      )
      .subscribe();

    this.statesFC.setValue(this.storedFilter?.states ? this.storedFilter.states : this.states);
  }

  checkHasStateFilterV2(stateFilterHash: HashMap<boolean>) {
    this.hasStateFilterV2 = false;
    const keys = Object.keys(stateFilterHash);

    keys.every(uuid => {
      if (stateFilterHash[uuid]) {
        this.hasStateFilterV2 = true;
        this.dashboardV2Service.setFiltersWidthHash(QuestionV2SourceFilter.STATE, STATE_WIDTH);
        return false;
      }

      return true;
    });

    this.cdr.detectChanges();
  }

  toggleselectAllStates(checked: boolean) {
    this.selectAllStates = checked;
    this.statesFC.setValue(checked ? this.states : []);
  }

  get statesFC() {
    return this.form?.controls['states'];
  }
}
