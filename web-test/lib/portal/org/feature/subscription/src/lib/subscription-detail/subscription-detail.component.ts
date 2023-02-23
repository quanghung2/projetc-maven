import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IAM_SERVICES, IAM_UI_ACTIONS, OrganizationPolicyQuery, OrgMemberQuery } from '@b3networks/api/auth';
import { Subscription, SubscriptionQuery, SubscriptionService } from '@b3networks/api/subscription';
import { X } from '@b3networks/shared/common';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { BillingCycleDialogComponent } from '../billing-cycle-dialog/billing-cycle-dialog.component';
import { ResubscribeDialogComponent } from '../resubscribe-dialog/resubscribe-dialog.component';
import { UnsubscribeDialogComponent } from '../unsubscribe-dialog/unsubscribe-dialog.component';

interface SubDetailData {
  subscription: Subscription;
  unsubscribeBtn: boolean;
  subscriptionInfo: boolean;
  features: boolean;
  numbers: boolean;
  userAssignment: boolean;
  billingCycle: boolean;
}

@Component({
  selector: 'pos-subscription-detail',
  templateUrl: './subscription-detail.component.html',
  styleUrls: ['./subscription-detail.component.scss']
})
export class SubscriptionDetailComponent implements OnInit {
  @Output() updateSubDetail: EventEmitter<boolean> = new EventEmitter();

  data$: Observable<SubDetailData>;

  assignee: string;

  viewMain = true;
  viewNumbers = false;
  viewUsers = false;

  constructor(
    private dialog: MatDialog,
    private orgMemberQuery: OrgMemberQuery,
    private subscriptionService: SubscriptionService,
    private subscriptionQuery: SubscriptionQuery,
    private iamPolicyQuery: OrganizationPolicyQuery
  ) {}

  ngOnInit(): void {
    this.data$ = this.subscriptionQuery.selectActive().pipe(
      filter(sub => sub != null),
      switchMap(sub =>
        combineLatest([
          of(sub),
          this.iamPolicyQuery.selectGrantedIAM(X.orgUuid, IAM_SERVICES.ui, IAM_UI_ACTIONS.show_subscription_menu)
        ])
      ),
      map(([sub, iam]) => {
        return <SubDetailData>{
          subscription: sub,
          unsubscribeBtn: iam == null || iam.hasResource('unsubscribe_btn'),
          subscriptionInfo: iam == null || iam.hasResource('subscription_info'),
          features: iam == null || iam.hasResource('features'),
          numbers: iam == null || iam.hasResource('numbers'),
          userAssignment: iam == null || iam.hasResource('user_assignment'),
          billingCycle: iam == null || iam.hasResource('billing_cycle')
        };
      }),
      tap(data => {
        if (data.subscription.assignees.length > 1) {
          this.assignee = `${data.subscription.assignees.length} users`;
        } else if (data.subscription.assignees.length) {
          const member = this.orgMemberQuery.getEntity(data.subscription.assignees[0]);
          this.assignee = member != null ? member.displayName : '--';
        } else {
          this.assignee = '--';
        }
      })
    );
  }

  unsubscribe(s: Subscription) {
    const dialog = this.dialog.open(UnsubscribeDialogComponent, {
      width: '37.5rem',
      disableClose: true,
      data: s
    });
    dialog.afterClosed().subscribe(res => {
      if (res) {
        this.subscriptionService.updateAutoRenewActive(res.autoRenew);
        this.updateSubDetail.emit(true);
      }
    });
  }

  resubscribe(s: Subscription) {
    const dialog = this.dialog.open(ResubscribeDialogComponent, {
      width: '25rem',
      disableClose: true,
      data: s
    });
    dialog.afterClosed().subscribe(res => {
      if (res) {
        this.subscriptionService.updateAutoRenewActive(res.autoRenew);
        this.updateSubDetail.emit(true);
      }
    });
  }

  changeSaleModel(s: Subscription) {
    const modalBillingCycleComponent = this.dialog.open(BillingCycleDialogComponent, {
      width: '37.5rem',
      disableClose: true,
      data: s
    });

    modalBillingCycleComponent.afterClosed().subscribe(res => {
      if (res) this.updateData(res);
    });
  }

  updateData(e: Subscription) {
    this.subscriptionService.updateActive(e);
    this.updateSubDetail.emit(e ? true : false);
  }
}
