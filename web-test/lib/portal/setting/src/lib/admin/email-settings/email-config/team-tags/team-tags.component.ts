import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { EmailIntegrationQuery, EmailIntegrationService, EmailSignature, EmailTag } from '@b3networks/api/workspace';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { TagDetailDialogComponent } from './tag-detail-dialog/tag-detail-dialog.component';

@Component({
  selector: 'b3n-team-tags',
  templateUrl: './team-tags.component.html',
  styleUrls: ['./team-tags.component.scss']
})
export class TeamTagsComponent extends DestroySubscriberComponent implements AfterViewInit {
  tags: EmailTag[] = [];
  displayedColumns = ['id', 'displayName', 'action'];
  dataSource: MatTableDataSource<EmailTag> = new MatTableDataSource<EmailTag>();
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(
    private emailIntegrationService: EmailIntegrationService,
    private emailIntegrationQuery: EmailIntegrationQuery,
    private dialog: MatDialog
  ) {
    super();
  }

  ngAfterViewInit() {
    this.emailIntegrationQuery.tags$.pipe(takeUntil(this.destroySubscriber$)).subscribe(tags => {
      this.tags = tags;
      this.updateDataSource();
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.filterPredicate = (data: EmailTag, value: string): boolean => {
      return data.name.toLowerCase().indexOf(value) > -1 || data.id.toString().indexOf(value) > -1;
    };
  }

  viewDetail(item: EmailTag) {
    if (!item) {
      item = new EmailTag();
    }
    this.dialog.open(TagDetailDialogComponent, {
      width: '950px',
      data: { ...item }
    });
  }

  delete(isDelete: boolean, item: EmailSignature) {
    if (isDelete) {
      this.emailIntegrationService.deleteTag(item.id).subscribe();
    }
  }

  private updateDataSource() {
    this.tags.sort((a, b) => a.id - b.id);
    this.dataSource = new MatTableDataSource<EmailTag>(this.tags);
    this.dataSource.paginator = this.paginator;
  }
}
