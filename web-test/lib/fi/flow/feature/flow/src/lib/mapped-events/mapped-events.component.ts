import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BaCreatorService, FlowActionReq, MappedEvent } from '@b3networks/api/flow';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-mapped-events',
  templateUrl: './mapped-events.component.html',
  styleUrls: ['./mapped-events.component.scss']
})
export class MappedEventsComponent extends DestroySubscriberComponent implements OnInit {
  param: FlowActionReq;
  loading: boolean;
  showWarning: boolean;
  dataSource: MappedEvent[];
  displayedColumns: string[] = ['name', 'latestVersion', 'latestUpdatedAt', 'actions'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private bacreatorService: BaCreatorService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.param = {
        flowUuid: params['flowUuid'],
        version: Number(params['version'])
      };
      this.getMappedEvents();
    });
  }

  getMappedEvents() {
    this.loading = true;
    this.bacreatorService
      .getMappedEvents(this.param.flowUuid)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(mappedEvents => {
        this.dataSource = mappedEvents;
        this.showWarning = this.dataSource.some(me => me.status === 'NEED_UPGRADE');
      });
  }

  mapNewVer(e: MappedEvent) {
    this.bacreatorService.setActiveMapEvent(e);
    this.router.navigate(['../flow', this.param.flowUuid, this.param.version, 'mapped-events', e.id], {
      relativeTo: this.route.parent,
      queryParams: { isUpgrade: true }
    });
  }

  edit(e: MappedEvent) {
    this.bacreatorService.setActiveMapEvent(e);
    this.router.navigate(['../flow', this.param.flowUuid, this.param.version, 'mapped-events', e.id], {
      relativeTo: this.route.parent
    });
  }

  deprecate(e: MappedEvent) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        disableClose: true,
        panelClass: 'fif-dialog',
        data: <ConfirmDialogInput>{
          title: 'Deprecate mapped event',
          message: `Are you sure you want to deprecate mapped event <strong>${e.triggerDef.name} (v${e.triggerDef.version})</strong>?`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.bacreatorService.deprecateMappedEvent(e.id).subscribe({
            next: () => {
              this.toastService.success(`Deprecate mapped event successful`);
              this.getMappedEvents();
            },
            error: err => this.toastService.error(`Deprecate failed: ${err.message}`)
          });
        }
      });
  }
}
