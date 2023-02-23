import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CaseActivity, CaseDetail, CaseQuery, CaseService, User } from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { isAfter } from 'date-fns';
import { isBefore } from 'date-fns/esm';
import { cloneDeep } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-case-activities',
  templateUrl: './case-activities.component.html',
  styleUrls: ['./case-activities.component.scss']
})
export class CaseActivitiesComponent extends DestroySubscriberComponent implements OnInit {
  readonly filters = [
    { key: 'showAll', value: 'Show all activity' },
    { key: 'showComment', value: 'Show comments only' },
    { key: 'showHistory', value: 'Show history only' }
  ];

  filterFC: FormControl = new FormControl(this.filters[0].key);

  @Input() me: User;
  @Input() case: CaseDetail;

  activities$: Observable<CaseActivity[]>;

  constructor(private caseQuery: CaseQuery, private caseService: CaseService) {
    super();
  }

  ngOnInit() {
    this.activities$ = this.caseQuery.selectActiveId().pipe(
      tap(() => {
        const iden: { id; sid; ownerOrgUuid } = this.caseQuery.getActive();
        this.caseService.getActivities(iden).subscribe();
      }),
      switchMap(id =>
        combineLatest([
          this.filterFC.valueChanges.pipe(distinctUntilChanged(), startWith('showAll')),
          this.caseQuery.selectEntity(id as number, 'activities').pipe(
            filter(l => l != null),
            map(list => {
              let r = cloneDeep(list);
              r = r.sort((a, b) =>
                isBefore(a.createdAt, b.createdAt) ? -1 : isAfter(a.createdAt, b.createdAt) ? 1 : 0
              );
              return r;
            })
          )
        ])
      ),
      filter((f, l) => f != null && l != null),
      map(([filter, list]) => {
        if (filter === 'showComment') {
          list = list.filter(l => l.type === 'comment');
        } else if (filter === 'showHistory') {
          list = list.filter(l => l.type === 'event');
        }

        return list;
      })
    );
  }

  trackByItem(_, item: CaseActivity) {
    return item?.id;
  }

  viewLog(event) {
    // const dialog = this.dialog.open(EventLogComponent, {
    //   width: event.type == 'editTitle' ? '900px' : '1200px',
    //   disableClose: true,
    //   data: {
    //     event: event
    //   }
    // });
  }
}
