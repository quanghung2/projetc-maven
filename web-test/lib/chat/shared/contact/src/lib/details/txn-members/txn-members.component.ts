import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { User, UserQuery, UserStatus } from '@b3networks/api/workspace';
import { Txn, TxnQuery } from '@b3networks/chat/shared/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'b3n-txn-members',
  templateUrl: './txn-members.component.html',
  styleUrls: ['./txn-members.component.scss']
})
export class TxnMembersComponent implements OnChanges {
  readonly UserStatus = UserStatus;

  members$: Observable<User[]>;
  txnUuid: string;

  @Input() txn: Txn;

  constructor(private userQuery: UserQuery, public dialog: MatDialog, private txnQuery: TxnQuery) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['txn'] && this.txnUuid !== this.txn?.txnUuid) {
      this.txnUuid = this.txn.txnUuid;

      this.members$ = this.txnQuery.selectEntity(this.txn.txnUuid, 'lastAssignedAgents').pipe(
        map(x => x || []),
        switchMap(list => this.userQuery.selectAllUserByIdentityIds(list)),
        map(m => this.sort(m))
      );
    }
  }

  sort(members: User[]) {
    return members.sort((a, b) => +b.isOnline - +a.isOnline);
  }
}
