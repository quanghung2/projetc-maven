import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Inbox, InboxesQuery, InboxesService, Widget, WidgetQuery, WidgetService } from '@b3networks/api/inbox';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, startWith, takeUntil } from 'rxjs';
import { ADMIN_LINK, APP_LINK } from '../../../shared/contants';
import { GenerateScriptComponent } from './generate-script/generate-script.component';
import { StoreWidgetComponent, StoreWidgetData } from './store-widget/store-widget.component';

@Component({
  selector: 'b3n-widget-list',
  templateUrl: './widget-list.component.html',
  styleUrls: ['./widget-list.component.scss']
})
export class WidgetListComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  loading: boolean;
  inbox: Inbox;
  searchCtrl = new FormControl();
  widgets: Widget[] = [];
  dataSource: MatTableDataSource<Widget> = new MatTableDataSource<Widget>();

  private _inboxUuid: string;

  readonly displayedColumns = ['uuid', 'name', 'createdAt', 'actions'];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private widgetService: WidgetService,
    private widgetQuery: WidgetQuery,
    private inboxesService: InboxesService,
    private inboxesQuery: InboxesQuery,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['inboxUuid']) {
        this._inboxUuid = params['inboxUuid'];
        this.inbox = this.inboxesQuery.getEntity(this._inboxUuid);
        if (!this.inbox) {
          this.inboxesService.getDetail(this._inboxUuid).subscribe();
        }

        this.fetchWidgets(this._inboxUuid);
      }
    });
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  generateScript(item: Widget) {
    this.dialog.open(GenerateScriptComponent, {
      data: item,
      width: '700px'
    });
  }

  saveOrUpdate(item: Widget) {
    console.log('item: ', item);
    this.dialog.open(StoreWidgetComponent, {
      data: <StoreWidgetData>{
        isCreate: !item,
        widget: item,
        inbox: this.inbox
      },
      width: '500px',
      disableClose: true
    });
  }

  refresh() {
    this.loading = true;
    this.widgetService
      .getAllByInboxUuid(this._inboxUuid)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe();
  }

  goBack() {
    this.router.navigate([APP_LINK.admin, ADMIN_LINK.inboxManagement]);
  }

  private fetchWidgets(inboxUuid: string) {
    this.widgetQuery
      .selectWidgetByInbox(inboxUuid)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(widgets => {
        this.widgets = widgets;
        if (!this.searchCtrl.value) {
          this.updateDataSource(this.widgets);
        } else {
          const data = this.widgets.filter(
            x =>
              x.uuid === this.searchCtrl.value?.trim() ||
              x.name?.toLowerCase().includes(this.searchCtrl.value?.trim()?.toLowerCase())
          );
          this.updateDataSource(data);
        }
      });

    this.searchCtrl.valueChanges.pipe(startWith(''), takeUntil(this.destroySubscriber$)).subscribe(value => {
      if (!value?.trim()) {
        this.updateDataSource(this.widgets);
        return;
      }

      const data = this.widgets.filter(
        x => x.uuid === value?.trim() || x.name?.toLowerCase().includes(value?.trim()?.toLowerCase())
      );
      this.updateDataSource(data);
    });

    this.refresh();
  }

  private updateDataSource(data: Widget[]) {
    this.dataSource.data = data;
    this.dataSource.paginator = this.paginator;
    this.cdr.detectChanges();
  }
}
