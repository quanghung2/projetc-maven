import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Page, Pageable } from '@b3networks/api/common';
import { AuthorConnector, AuthorService } from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { ConnectorDialogComponent } from '../connector-dialog/connector-dialog.component';

@Component({
  selector: 'b3n-list-connector',
  templateUrl: './list-connector.component.html',
  styleUrls: ['./list-connector.component.scss']
})
export class ListConnectorComponent implements OnInit {
  pageable = <Pageable>{ page: 0, perPage: 10 };
  connectorsPage$: Observable<Page<AuthorConnector>>;
  displayedColumns = ['name', 'publish', 'lastUpdatedAt'];

  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: ToastService,
    private authorService: AuthorService
  ) {}

  ngOnInit(): void {
    this.getConnectors();
    this.authorService.reset();
  }

  getConnectors() {
    this.connectorsPage$ = this.authorService.getListConnector(this.pageable);
  }

  copied() {
    this.toastr.success('Copied to clipboard');
  }

  changePage(page?: number) {
    this.pageable.page = page;
    this.getConnectors();
  }

  createConnector() {
    this.dialog
      .open(ConnectorDialogComponent, {
        width: '500px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false
      })
      .afterClosed()
      .subscribe((connector: AuthorConnector) => {
        if (connector) {
          this.viewConnector(connector);
        }
      });
  }

  viewConnector(e: AuthorConnector) {
    this.authorService.setActiveConnector(e);
    this.router.navigate(['connector', e.uuid], { relativeTo: this.activatedRoute });
  }
}
