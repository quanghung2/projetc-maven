import { Location } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { InboundRule, InboundRuleService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, tap } from 'rxjs/operators';
import {
  CallerIdPlanComponent,
  InboundRuleStore
} from '../../../shared/inbound-rule-detail/caller-id-plan/caller-id-plan.component';
import { CreateComponent } from './create/create.component';

@Component({
  selector: 'b3n-inbound-rule-list',
  templateUrl: './inbound-rule-list.component.html',
  styleUrls: ['./inbound-rule-list.component.scss']
})
export class InboundRuleListComponent extends DestroySubscriberComponent implements OnInit {
  readonly displayedColumns = ['name', 'actions'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  fetching: boolean;
  dataSource = new MatTableDataSource<InboundRule>();
  defaultRule: InboundRule;

  constructor(
    private location: Location,
    private inboundRuleService: InboundRuleService,
    private dialog: MatDialog,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.fetching = true;
    this.inboundRuleService.getDefaultOrgInboundRule().subscribe(rule => {
      this.defaultRule = rule;
    });
    this.inboundRuleService
      .getInboundRules()
      .pipe(
        finalize(() => (this.fetching = false)),
        tap(rules => {
          this.updateDataSource(rules);
        })
      )
      .subscribe();
  }

  updateDataSource(rules: any[]) {
    this.dataSource = new MatTableDataSource<InboundRule>(rules);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }

  openDialogCreateRule() {
    this.dialog
      .open(CreateComponent, {
        width: '400px'
      })
      .afterClosed()
      .subscribe(status => {
        if (status && status.ok) {
          this.fetchData();
        }
      });
  }

  update(rule: InboundRule) {
    this.dialog.open(CallerIdPlanComponent, {
      width: '800px',
      autoFocus: false,
      data: <InboundRuleStore>{
        inboundRule: rule,
        isDefaultRule: false
      }
    });
  }

  openDefaultRule() {
    this.dialog.open(CallerIdPlanComponent, {
      width: '800px',
      autoFocus: false,
      data: <InboundRuleStore>{
        inboundRule: new InboundRule(this.defaultRule),
        isDefaultRule: true
      }
    });
  }

  openConfirmDialog(rule: InboundRule) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        autoFocus: false,
        data: <ConfirmDialogInput>{
          title: 'Delete inbound rule',
          message: `Are you sure to delete ${rule.name} rule?`,
          color: 'warn',
          confirmLabel: 'Delete'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.delete(rule);
        }
      });
  }

  delete(rule: InboundRule) {
    this.inboundRuleService.delete(rule.id).subscribe(
      _ => {
        this.toastService.success('Deleted successfully');
        this.fetchData();
      },
      error => {
        this.toastService.error(error.message || 'Cannot delete this rule. Please try again in a few minutes');
      }
    );
  }

  goBack() {
    this.location.back();
  }
}
