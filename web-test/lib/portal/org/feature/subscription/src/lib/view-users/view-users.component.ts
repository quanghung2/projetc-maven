import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { GetMembersReq, Member, OrgMemberService } from '@b3networks/api/auth';
import {
  FindSubscriptionReq,
  RemoveMemberReq,
  Subscription,
  SubscriptionQuery,
  SubscriptionService
} from '@b3networks/api/subscription';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { debounceTime, finalize, map, mergeMap, startWith, tap } from 'rxjs/operators';
import { RemoveMemberDialogComponent } from '../remove-member-dialog/remove-member-dialog.component';

@Component({
  selector: 'pos-view-users',
  templateUrl: './view-users.component.html',
  styleUrls: ['./view-users.component.scss']
})
export class ViewUsersComponent implements OnInit {
  @Output() backEvent: EventEmitter<Subscription> = new EventEmitter();

  subscription: Subscription;

  loading = false;
  assignedMembers$: Observable<Member[]>;
  filteringMembers$: Observable<Member[]>;
  membersDeactivated: number = 0;

  userCtrl = new UntypedFormControl([]);
  userFilterCtrl = new UntypedFormControl();

  constructor(
    private subscriptionQuery: SubscriptionQuery,
    private subscriptionService: SubscriptionService,
    private dialog: MatDialog,
    private toastr: ToastService,
    private orgMemberService: OrgMemberService
  ) {}

  ngOnInit(): void {
    this.subscription = this.subscriptionQuery.getActive();
    this.getAssignedMembers();
    this.filteringMembers$ = this.userFilterCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(200),
      mergeMap(searchSTring => {
        const req = {
          keyword: searchSTring,
          orgUuid: this.subscription.orgUuid,
          excludeUuids: this.subscription.assignees
        } as GetMembersReq;
        return this.orgMemberService.getMembers(req, { page: 0, perPage: 20 });
      }),
      map(page => page.content)
    );
  }

  assign() {
    this.loading = true;
    this.subscriptionService
      .assignMembers(this.subscription, this.userCtrl.value)
      .pipe(
        mergeMap(res => {
          const subscriptionReq = new FindSubscriptionReq({
            uuid: this.subscription.uuid,
            embed: ['numbers', 'assignees', 'prices']
          });
          return this.subscriptionService.findSubscriptions(
            subscriptionReq,
            { page: 1, perPage: 1 },
            { usingPaginationPlugin: true }
          );
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(res => {
        this.toastr.success('You have successfully assigned members.');
        this.subscription = res.data[0];
        this.getAssignedMembers();
        this.userCtrl.setValue([]);
      });
  }

  remove(i: Member) {
    const modalRemoveMember = this.dialog.open(RemoveMemberDialogComponent, {
      width: '25rem',
      disableClose: true,
      data: <RemoveMemberReq>{ subscription: this.subscription, member: i }
    });

    modalRemoveMember.afterClosed().subscribe(result => {
      if (result) {
        this.subscription = result;
        this.getAssignedMembers();
      }
    });
  }

  back() {
    this.backEvent.emit(this.subscription);
  }

  getAssignedMembers() {
    this.assignedMembers$ = this.orgMemberService
      .getMembers(<GetMembersReq>{ orgUuid: X.orgUuid, memberUuids: this.subscription.assignees }, {
        page: 0,
        perPage: this.subscription.assignees.length
      })
      .pipe(
        map(page => page.content),
        tap(res => {
          this.membersDeactivated = this.subscription.assignees.length - res.length;
        })
      );
  }
}
