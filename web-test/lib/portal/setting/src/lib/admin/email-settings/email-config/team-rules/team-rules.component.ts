import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { EmailIntegrationQuery, EmailIntegrationService, EmailRule, Status } from '@b3networks/api/workspace';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MatDialog } from '@angular/material/dialog';
import { filter, takeUntil } from 'rxjs/operators';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { RuleDetailDialogComponent } from './rule-detail-dialog/rule-detail-dialog.component';

@Component({
  selector: 'b3n-team-rules',
  templateUrl: './team-rules.component.html',
  styleUrls: ['./team-rules.component.scss']
})
export class TeamRulesComponent extends DestroySubscriberComponent implements AfterViewInit {
  rules: EmailRule[] = [];
  displayedColumns = ['displayName', 'status', 'action'];
  dataSource: MatTableDataSource<EmailRule> = new MatTableDataSource<EmailRule>();
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(
    private emailIntegrationQuery: EmailIntegrationQuery,
    private emailIntegrationService: EmailIntegrationService,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    super();
  }

  ngAfterViewInit() {
    this.emailIntegrationQuery.rules$
      .pipe(
        filter(s => !!(s && s.length)),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(rules => {
        this.rules = rules;
        this.updateDataSource();
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.filterPredicate = (data: EmailRule, value: string): boolean => {
      return data.name.toLowerCase().indexOf(value) > -1;
    };
  }

  viewDetail(item: EmailRule) {
    if (!item) {
      item = new EmailRule();
    }
    this.dialog.open(RuleDetailDialogComponent, {
      width: '950px',
      data: { ...item }
    });
  }

  changeVisible(e, rule: EmailRule) {
    e.stopPropagation();
    if (rule.status === Status.active) {
      rule = { ...rule, status: Status.archived };
    } else if (rule.status === Status.archived) {
      rule = { ...rule, status: Status.active };
    }
    this.emailIntegrationService.updateRule(rule).subscribe(
      () => {},
      error => {
        console.error(error);
      }
    );
  }

  private updateDataSource() {
    this.rules.sort((a, b) => a.id - b.id);
    this.dataSource = new MatTableDataSource<EmailRule>(this.rules);
    this.dataSource.paginator = this.paginator;
  }

  delete(isDelete: boolean, item: EmailRule) {
    if (isDelete) {
      this.emailIntegrationService.deleteRule(item.id).subscribe();
    }
  }
}
