import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { DialPlanV3, OutboundRule, OutboundRuleService } from '@b3networks/api/callcenter';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { DefaultDialPlanComponent } from '../default-dial-plan/default-dial-plan.component';
import { StoreDialPlanComponent } from '../store-dial-plan/store-dial-plan.component';

export interface InputStoreDialPlan {
  rule: OutboundRule;
  dialPlan: DialPlanV3;
}

@Component({
  selector: 'pos-dial-plan',
  templateUrl: './dial-plan.component.html',
  styleUrls: ['./dial-plan.component.scss']
})
export class DialPlanComponent implements OnInit, OnChanges {
  readonly dialPlanDisplayedColumns = ['pattern', 'replacement', 'actions'];
  @ViewChild('dialPlansPaginator') dialPlansPaginator: MatPaginator;
  @Input() rule: OutboundRule;
  dialPlanDataSource = new MatTableDataSource<DialPlanV3>();
  isAdmin: boolean;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private outboundRuleService: OutboundRuleService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private profileQuery: IdentityProfileQuery
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.profileQuery.currentOrg.isUpperAdmin;
  }

  getDialPlans() {
    this.outboundRuleService.getDialPlans(this.rule.id).subscribe(res => {
      this.dialPlanDataSource = new MatTableDataSource<DialPlanV3>(res);
      setTimeout(() => {
        this.dialPlanDataSource.paginator = this.dialPlansPaginator;
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.getDialPlans();
  }

  addPlan() {
    this.dialog
      .open(StoreDialPlanComponent, {
        width: '450px',
        autoFocus: false,
        data: <InputStoreDialPlan>{
          rule: this.rule
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res && res['added']) {
          this.toastService.success('Added successfully');
          this.getDialPlans();
        }
      });
  }

  importDefaultPlans() {
    this.dialog
      .open(DefaultDialPlanComponent, {
        minWidth: '500px',
        data: this.rule.id
      })
      .afterClosed()
      .subscribe(res => {
        if (res && res['imported']) {
          this.getDialPlans();
          this.toastService.success('Imported successfully');
        }
      });
  }

  removeDialPlan(plan: DialPlanV3) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Confirm remove dial plan',
          message: `Are you are to remove this plan?`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.outboundRuleService.removeDialPlan(plan).subscribe(
            _ => {
              this.toastService.success('Removed successfully');
              this.getDialPlans();
            },
            err => {
              this.toastService.error(err.message);
            }
          );
        }
      });
  }

  updateDialPlan(dialPlan: DialPlanV3) {
    this.dialog
      .open(StoreDialPlanComponent, {
        autoFocus: false,
        data: <InputStoreDialPlan>{
          rule: this.rule,
          dialPlan: dialPlan
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res && res['added']) {
          this.getDialPlans();
          this.toastService.success('Updated successfully');
        }
      });
  }
}
