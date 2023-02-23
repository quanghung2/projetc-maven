import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MeQuery, User, UserQuery } from '@b3networks/api/workspace';
import { debounceTime, Observable, of, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'b3n-search-member',
  templateUrl: './search-member.component.html',
  styleUrls: ['./search-member.component.scss']
})
export class SearchMemberComponent implements OnInit {
  keywordFC: FormControl = new FormControl();

  me$: Observable<User>;
  filteredMembers$: Observable<User[]>;

  @Input() useFor: 'filter' | 'assign';

  @Output() searchResultChange = new EventEmitter<User>();

  constructor(private meQuery: MeQuery, private userQuery: UserQuery) {}

  ngOnInit(): void {
    this.me$ = this.meQuery.me$;
    this._handleSearchChange();
  }

  onSelectionChange(e) {
    const result: User = e.source._value.length ? e.source._value[0] : null;
    this.searchResultChange.emit(result);
  }

  trackByMmeber(_, item: User) {
    return item?.uuid;
  }

  private _handleSearchChange() {
    this.filteredMembers$ = this.keywordFC.valueChanges.pipe(
      debounceTime(300),
      startWith(''),
      switchMap(value => {
        if (value == null || value instanceof User) {
          this.searchResultChange.emit(value);
        }

        let result = this.userQuery.getAllUsersContains(value);
        if (!this.keywordFC) {
          result = result.filter(l => l.uuid !== this.meQuery.getMe().uuid);
        }
        return of(result);
      })
    );
  }
}
