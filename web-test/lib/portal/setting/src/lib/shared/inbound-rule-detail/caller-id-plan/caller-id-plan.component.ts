import { Component, Inject, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import {
  CreateOrUpdateInboundRuleReq,
  EntityStatus,
  ExtensionQuery,
  InboundRule,
  InboundRulePlan,
  InboundRuleService
} from '@b3networks/api/callcenter';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import {
  StoreCallerIdPlanComponent,
  StoreCallerIdPlanInput
} from '../store-caller-id-plan/store-caller-id-plan.component';

export interface InboundRuleStore {
  inboundRule: InboundRule;
  isDefaultRule: boolean;
}

@Component({
  selector: 'b3n-caller-id-plan',
  templateUrl: './caller-id-plan.component.html',
  styleUrls: ['./caller-id-plan.component.scss']
})
export class CallerIdPlanComponent implements OnInit, OnChanges {
  readonly callerIdDisplayedColumns = ['pattern', 'replacement', 'actions'];

  @ViewChild('callerIdPlansPaginator') callerIdPlansPaginator: MatPaginator;
  inboundRule: InboundRule;

  isAdmin: boolean;
  dataSource = new MatTableDataSource<InboundRulePlan>();
  onDialog: boolean;
  RULE_STATUS = EntityStatus;
  savingRule: boolean;
  defaultRule: InboundRule;

  constructor(
    private inboundRuleService: InboundRuleService,
    private profileQuery: IdentityProfileQuery,
    private dialog: MatDialog,
    private toastService: ToastService,
    private extensionQuery: ExtensionQuery,
    @Inject(MAT_DIALOG_DATA) public data: InboundRuleStore
  ) {
    this.onDialog = Object.keys(this.data).length > 0;
  }

  ngOnInit(): void {
    this.isAdmin = this.profileQuery.currentOrg.isUpperAdmin;

    this.inboundRuleService.getDefaultOrgInboundRule().subscribe(rule => {
      this.defaultRule = rule;
    });
    if (this.data && this.data.inboundRule instanceof InboundRule) {
      this.inboundRule = this.data.inboundRule;
      this.initInboundRulePlans();
      return;
    }

    const extension = this.extensionQuery.getActive();
    this.inboundRuleService.getInboundRules().subscribe(rules => {
      this.inboundRule = rules.find(rule => rule.name === extension['incomingCallRule']);

      this.initInboundRulePlans();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {}

  initInboundRulePlans() {
    this.dataSource = new MatTableDataSource<InboundRulePlan>(this.inboundRule.inboundRulePlans || []);
    setTimeout(() => {
      this.dataSource.paginator = this.callerIdPlansPaginator;
    });
  }

  openStoreCallerIdDialog(plan?: InboundRulePlan) {
    const index = this.dataSource.filteredData.indexOf(plan);
    this.dialog
      .open(StoreCallerIdPlanComponent, {
        width: '450px',
        autoFocus: false,
        data: <StoreCallerIdPlanInput>{
          rule: this.inboundRule,
          callerIdPlan: plan || null,
          index: index
        }
      })
      .afterClosed()
      .subscribe(status => {
        if (status && status.ok) {
          this.initInboundRulePlans();
        }
      });
  }

  remove(plan) {
    const index = this.dataSource.filteredData.indexOf(plan);
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Remove Caller ID Plan',
          message: 'Are you sure to remove this plan?',
          color: 'warn',
          confirmLabel: 'Remove'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          const newPlans = this.inboundRule.inboundRulePlans;
          if (index >= 0) {
            newPlans.splice(index, 1);
          }
          const req = {
            name: this.inboundRule.name,
            type: 'accept',
            inboundRulePlans: newPlans
          } as CreateOrUpdateInboundRuleReq;

          this.inboundRuleService.update(this.inboundRule.id, req).subscribe(
            _ => {
              this.toastService.success('Deleted successfully');

              this.initInboundRulePlans();
            },
            error => {
              this.toastService.error(error.message);
            }
          );
        }
      });
  }

  editInboundRule() {
    const status = this.defaultRule.status === this.RULE_STATUS.ACTIVE ? 'Disable' : 'Enable';
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: `${status} Default Rule`,
          message: `Are you sure to ${status.toLocaleLowerCase()} default rule?`,
          color: this.defaultRule.status === this.RULE_STATUS.ACTIVE ? 'warn' : 'primary',
          confirmLabel: status
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.savingRule = true;
          this.inboundRuleService
            .update(this.defaultRule.id, {
              status:
                this.defaultRule.status === this.RULE_STATUS.ACTIVE
                  ? this.RULE_STATUS.INACTIVE
                  : this.RULE_STATUS.ACTIVE
            })
            .pipe(finalize(() => (this.savingRule = false)))
            .subscribe(
              _ => {
                this.inboundRuleService.getDefaultOrgInboundRule().subscribe(rule => {
                  this.defaultRule = rule;
                  this.RULE_STATUS;
                });
                this.toastService.success(
                  `${
                    this.defaultRule.status === this.RULE_STATUS.ACTIVE ? 'Disable' : 'Enable'
                  } inbound rule successfully`
                );
              },
              err => this.toastService.warning(err.message)
            );
        }
      });
  }
}
