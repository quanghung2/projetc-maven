import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Inbox, InboxesQuery, InboxesService } from '@b3networks/api/inbox';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Order } from '@datorama/akita';
import { finalize, startWith, takeUntil } from 'rxjs/operators';
import { StoreInboxComponent, StoreInboxData } from './store-inbox/store-inbox.component';

@Component({
  selector: 'b3n-inbox-list',
  templateUrl: './inbox-list.component.html',
  styleUrls: ['./inbox-list.component.scss']
})
export class InboxListComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  searchCtrl = new FormControl();
  loading: boolean;
  inboxes: Inbox[] = [];
  dataSource: MatTableDataSource<Inbox> = new MatTableDataSource<Inbox>();

  readonly displayedColumns = ['uuid', 'name', 'mode', 'createdAt', 'actions'];

  constructor(
    private toastService: ToastService,
    private inboxesService: InboxesService,
    private inboxesQuery: InboxesQuery,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {
    super();
  }

  ngOnInit() {
    this.inboxesQuery
      .selectAll({
        sortBy: 'createdAt',
        sortByOrder: Order.DESC
      })
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(inboxes => {
        this.inboxes = inboxes;
        if (!this.searchCtrl.value) {
          this.updateDataSource(this.inboxes);
        } else {
          const data = this.inboxes.filter(
            x =>
              x.uuid === this.searchCtrl.value?.trim() ||
              x.name?.toLowerCase().includes(this.searchCtrl.value?.trim()?.toLowerCase())
          );
          this.updateDataSource(data);
        }
      });

    this.searchCtrl.valueChanges.pipe(startWith(''), takeUntil(this.destroySubscriber$)).subscribe(value => {
      if (!value?.trim()) {
        this.updateDataSource(this.inboxes);
        return;
      }

      const data = this.inboxes.filter(
        x => x.uuid === value?.trim() || x.name?.toLowerCase().includes(value?.trim()?.toLowerCase())
      );
      this.updateDataSource(data);
    });

    this.refresh();
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  viewWidgets(item: Inbox) {
    this.router.navigate([item.uuid], {
      relativeTo: this.route
    });
  }

  saveOrUpdate(item: Inbox) {
    this.dialog.open(StoreInboxComponent, {
      data: <StoreInboxData>{
        isCreate: !item,
        inbox: item
      },
      width: '500px',
      disableClose: true
    });
  }

  refresh() {
    this.loading = true;
    this.inboxesService
      .getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe();
  }

  private updateDataSource(data: Inbox[]) {
    this.dataSource.data = data;
    this.dataSource.paginator = this.paginator;
    this.cdr.detectChanges();
  }
}
