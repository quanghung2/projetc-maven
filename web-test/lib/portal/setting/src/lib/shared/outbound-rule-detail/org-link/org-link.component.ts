import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IdentityProfileQuery, OrgLink } from '@b3networks/api/auth';
import { DialPlanV3, OrgLinkConfig, OutboundRule, OutboundRuleService } from '@b3networks/api/callcenter';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { tap } from 'rxjs/operators';
import { StoreOrgLinkComponent } from '../store-org-link/store-org-link.component';

@Component({
  selector: 'pos-org-link',
  templateUrl: './org-link.component.html',
  styleUrls: ['./org-link.component.scss']
})
export class OrgLinkComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() orgLinks: OrgLink[];
  @Input() rule: OutboundRule;

  displayedColumns: string[] = ['prefix', 'name', 'actions'];
  isAdmin: boolean;
  dataSource: MatTableDataSource<OrgLinkConfig>;
  orgLinkConfigs: OrgLinkConfig[];
  dialPlan: DialPlanV3;
  orgGroupUuids: Set<string> = new Set<string>();

  constructor(
    public dialog: MatDialog,
    private outboundRuleService: OutboundRuleService,
    private profileQuery: IdentityProfileQuery,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.profileQuery.currentOrg.isUpperAdmin;
    this.getOrgLinkConfigs();
  }

  openStoreOrgLinkDialog(orgLinkConfig: OrgLinkConfig = null): void {
    this.dialog
      .open(StoreOrgLinkComponent, {
        width: '450px',
        data: {
          orgLinkConfig,
          orgLinks: this.orgLinks,
          rule: this.rule
        }
      })
      .afterClosed()
      .pipe(
        tap(res => {
          if (!res) {
            return;
          }

          this.refresh();
        })
      )
      .subscribe();
  }

  getOrgLinkConfigs() {
    this.orgLinkConfigs = [];
    this.orgGroupUuids = new Set<string>();

    const orgLinks = this.rule.orgLinkConfig.orgLinks;
    const keys = Object.keys(orgLinks);

    if (!keys.length) {
      return;
    }

    for (let i = 0; i < keys.length; i++) {
      const groupUuid = orgLinks[keys[i]].groupUuid;
      const orgLinkConfig = new OrgLinkConfig({
        orgUuid: keys[i],
        orgGroupUuid: groupUuid,
        prefix: orgLinks[keys[i]].prefix,
        name: this.orgLinks.find(o => o.uuid === groupUuid).organizations.find(o => o.uuid === keys[i]).name
      });

      this.orgGroupUuids.add(groupUuid);
      this.orgLinkConfigs.push(orgLinkConfig);
    }

    this.dataSource = new MatTableDataSource(this.orgLinkConfigs);
    this.dataSource.filterPredicate = (data: OrgLinkConfig, filter: string) => {
      return data.orgGroupUuid === filter;
    };

    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    }, 0);
  }

  removeOlc(targetOrgUuid: string) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Remove',
          message: `Are you sure to remove this organization link config?`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.outboundRuleService.delOrgLinkConfig(this.rule.id, targetOrgUuid).subscribe(
            _ => {
              this.toastService.success(`Remove successfully`);
              this.refresh();
            },
            err => this.toastService.warning(err.message)
          );
        }
      });
  }

  refresh() {
    this.outboundRuleService.getOutboundRuleById(this.rule.id).subscribe(rule => {
      this.rule = rule;
      this.getOrgLinkConfigs();
    });
  }

  filter(orgLinkUuid: string) {
    this.dataSource.filter = orgLinkUuid;
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }
}
