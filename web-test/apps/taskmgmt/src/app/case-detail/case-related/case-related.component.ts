import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Case,
  CaseDetail,
  CaseIdentity,
  CaseQuery,
  CaseService,
  QueryCaseReq,
  RelatedCase
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, startWith, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-case-related',
  templateUrl: './case-related.component.html',
  styleUrls: ['./case-related.component.scss']
})
export class CaseRelatedComponent extends DestroySubscriberComponent implements OnInit {
  relatedCases$: Observable<RelatedCase[]>;

  searchCaseFC = new FormControl();
  selectedCasesFG = new FormControl();
  isAddingRelatedCase = false;

  filteringCase$: Observable<Case[]>;

  private _caseIden: CaseIdentity;
  @Input() case: CaseDetail;
  @Output() updateLastUpdatedAt = new EventEmitter<number>();

  constructor(
    private router: Router,
    private caseQuery: CaseQuery,
    private caseService: CaseService,
    private toastr: ToastService
  ) {
    super();
  }

  ngOnInit() {
    this.relatedCases$ = this.caseQuery.selectActiveId().pipe(
      tap(() => {
        this._caseIden = this.caseQuery.getActive();
        this.caseService.getRelatedCases(this._caseIden).subscribe();
      }),
      switchMap(id => this.caseQuery.selectEntity(id as number, 'relatedCases')),
      tap(r => console.log(r))
    );

    this.filteringCase$ = this.searchCaseFC.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      mergeMap(searchSTring => {
        const req = {
          textSearch: searchSTring
        } as QueryCaseReq;
        return this.caseService.queryAllCases(req, { page: 1, perPage: 5 }, { ignoreUpdateStore: true }).pipe(
          catchError(() => of(null)),
          map(page => (!page ? [] : page.data)),
          tap(r => console.log(r))
        );
      })
    );
  }

  linkCase(relatedCase: Case) {
    console.log(this.selectedCasesFG.value);

    this.caseService
      .updateRelatedCases(
        { id: this.case.id, sid: this.case.sid, ownerOrgUuid: this.case.ownerOrgUuid },
        { action: 'add', sid: relatedCase.sid, orgUuid: relatedCase.ownerOrgUuid }
      )
      .subscribe(() => {
        this.toastr.success('Linked case');
      });
  }

  unlinkCase(relatedCase: RelatedCase) {
    this.caseService
      .updateRelatedCases(this._caseIden, { action: 'remove', sid: relatedCase.sid, orgUuid: relatedCase.orgUuid })
      .subscribe(() => {
        this.toastr.success('Unlinked case');
      });
  }

  goToCase(e, cases: RelatedCase) {
    if (e.which == 2 || (e.which == 1 && event['ctrlKey'])) {
      const url = new URL(window.parent.location.href);
      const href = `${url.origin}/#/cases/${cases.orgUuid}/${cases.sid}`;

      window.open(href, '_blank');
    } else {
      this.router.navigate(['cases', cases.orgUuid, cases.sid]);
    }
  }
}
