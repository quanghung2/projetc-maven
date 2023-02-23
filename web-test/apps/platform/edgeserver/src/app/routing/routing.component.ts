import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  Cluster,
  ClusterQuery,
  ClusterService,
  Context,
  CRURoutingReq,
  DeleteClidRoutingReq,
  DeleteDnisRoutingReq,
  Direction,
  Peer,
  PeerService,
  PreConfig,
  PreConfigQuery,
  PreConfigService,
  Routing,
  RoutingService,
  Table
} from '@b3networks/api/edgeserver';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ClidModalComponent, ClidModalInput } from './clid-modal/clid-modal.component';
import { DnisModalComponent, DnisModalInput } from './dnis-modal/dnis-modal.component';

@Component({
  selector: 'b3n-routing',
  templateUrl: './routing.component.html',
  styleUrls: ['./routing.component.scss']
})
export class RoutingComponent extends DestroySubscriberComponent implements OnInit {
  readonly planname: string = 'default';
  readonly displayedColumnsDnis: string[] = ['dnis', 'peer1', 'peer2', 'load', 'action'];
  readonly displayedColumnsClid: string[] = ['clid', 'peer1', 'peer2', 'load', 'tag', 'action'];

  isLoadingDnis: boolean;
  isLoadingClid: boolean;

  dnisFilterCtrl = new UntypedFormControl();
  listDnisDataSource = new MatTableDataSource<Routing>();

  clidFilterCtrl = new UntypedFormControl();
  listClidDataSource = new MatTableDataSource<Routing>();

  preConfig: PreConfig;
  peers: Peer[] = [];
  schemas: Table[];
  clusters$: Observable<Cluster[]>;
  curCluster: Cluster;

  @ViewChild('dnisPagination', { static: true }) dnisPaginator: MatPaginator;
  @ViewChild('clidPagination', { static: true }) clidPaginator: MatPaginator;

  constructor(
    private routingService: RoutingService,
    private peerService: PeerService,
    private preConfigService: PreConfigService,
    private preConfigQuery: PreConfigQuery,
    private clusterQuery: ClusterQuery,
    private clusterService: ClusterService,
    private dialog: MatDialog,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.clusters$ = this.clusterQuery.selectAll();

    this.clusterQuery
      .selectActive()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(cluster => {
        this.curCluster = cluster;
        this.getDnisRouting();
        this.getClidRouting();
        this.routingService.getTable(this.curCluster.cluster).subscribe(
          schemas => (this.schemas = schemas),
          err => (this.schemas.length = 0)
        );
      });

    this.preConfigQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(preConfig => {
        this.preConfig = preConfig;
        let interfaces = [];
        Object.values(preConfig.cluster).forEach(arr => {
          interfaces = interfaces.concat(arr.filter(i => i.context === Context.outside));
        });
        interfaces = [...new Set(interfaces.map(i => i.name))];

        this.peerService.getPeer(this.curCluster.cluster).subscribe(peers => {
          this.peers = peers.filter(
            peer => interfaces.includes(peer.interface) && peer.direction === Direction.outbound
          );
        });
      });

    this.dnisFilterCtrl.valueChanges.subscribe(val => {
      this.listDnisDataSource.filter = val;
    });

    this.clidFilterCtrl.valueChanges.subscribe(val => {
      this.listClidDataSource.filter = val;
    });
  }

  onChangeCluster() {
    this.clusterService.selectCluster(this.curCluster);
    this.preConfigService.getPreConfig(this.curCluster.cluster).subscribe();
  }

  getDnisRouting() {
    const request: CRURoutingReq = {
      context: Context.inside,
      planname: this.planname
    };
    this.isLoadingDnis = true;
    this.routingService
      .getDnisRouting(request, this.curCluster.cluster)
      .pipe(finalize(() => (this.isLoadingDnis = false)))
      .subscribe(res => {
        let data = [...res];
        data = data?.sort((a, b) => Number(a.dnis) - Number(b.dnis));
        this.updateDataSourceForDnis(data);
      });
  }

  getClidRouting() {
    const request: CRURoutingReq = {
      context: Context.inside,
      planname: this.planname
    };
    this.isLoadingClid = true;
    this.routingService
      .getClidRouting(request, this.curCluster.cluster)
      .pipe(finalize(() => (this.isLoadingClid = false)))
      .subscribe(
        res => {
          let data = [...res];
          data = data?.sort((a, b) => {
            return ('' + a.tag).localeCompare(b.tag);
          });
          this.updateDataSourceForClid(data);
        },
        error => this.toastService.error(error)
      );
  }

  onOpenCreateDnisModal() {
    this.dialog
      .open(DnisModalComponent, {
        width: '500px',
        data: <DnisModalInput>{
          isEdit: false,
          preConfig: this.preConfig,
          listDnisData: [...this.listDnisDataSource?.filteredData],
          clidsData: [...new Set(this.listClidDataSource?.filteredData.map(i => i.tag))],
          peers: this.peers,
          cluster: this.curCluster.cluster
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.getDnisRouting();
          this.toastService.success('Create DNIS routing successfully');
          return;
        }

        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  onOpenCreateClidModal() {
    this.dialog
      .open(ClidModalComponent, {
        width: '500px',
        data: <ClidModalInput>{
          isEdit: false,
          preConfig: this.preConfig,
          peers: this.peers,
          clidsData: [...this.listClidDataSource?.filteredData],
          cluster: this.curCluster.cluster
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.getClidRouting();
          this.toastService.success('Create CLID routing successfully');
          return;
        }

        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  editDnisRouting(dnis: Routing) {
    this.dialog
      .open(DnisModalComponent, {
        width: '500px',
        data: <DnisModalInput>{
          isEdit: true,
          preConfig: this.preConfig,
          dnisData: dnis,
          listDnisData: [...this.listDnisDataSource.filteredData],
          peers: this.peers,
          clidsData: [...new Set(this.listClidDataSource?.filteredData.map(i => i.tag))],
          cluster: this.curCluster.cluster
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.getDnisRouting();
          this.toastService.success('Edit DNIS routing successfully');
          return;
        }

        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  editClidRouting(clid: Routing) {
    this.dialog
      .open(ClidModalComponent, {
        width: '500px',
        data: <ClidModalInput>{
          isEdit: true,
          preConfig: this.preConfig,
          clidData: clid,
          peers: this.peers,
          clidsData: [...this.listClidDataSource?.filteredData],
          cluster: this.curCluster.cluster
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.getClidRouting();
          this.toastService.success('Edit CLID routing successfully');
          return;
        }

        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  confirmDnisRouting(dnis: Routing) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete DNIS routing',
          message: 'Are you sure you want to delete this DNIS?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.deleteDnis(dnis);
        }
      });
  }

  confirmClidRouting(clid: Routing) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete CLID routing',
          message: 'Are you sure you want to delete this CLID?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.deleteClid(clid);
        }
      });
  }

  private deleteDnis(dnisRouting: Routing) {
    const request: DeleteDnisRoutingReq = {
      context: Context.inside,
      planname: this.planname,
      matching: dnisRouting.matching,
      dnis: dnisRouting.dnis
    };
    this.routingService.deleteDnisRouting(request, this.curCluster.cluster).subscribe(
      res => {
        this.getDnisRouting();
        this.toastService.success('Delete DNIS routing successfully');
      },
      error => {
        this.toastService.error(error);
      }
    );
  }

  private deleteClid(clidRouting: Routing) {
    const request: DeleteClidRoutingReq = {
      context: Context.inside,
      planname: this.planname,
      matching: clidRouting.matching,
      clid: clidRouting.clid,
      tag: clidRouting.tag
    };
    this.routingService.deleteClidRouting(request, this.curCluster.cluster).subscribe(
      res => {
        this.getClidRouting();
        this.toastService.success('Delete CLID routing successfully');
      },
      error => {
        this.toastService.error(error);
      }
    );
  }

  private updateDataSourceForDnis(dnis: Routing[]) {
    this.listDnisDataSource = new MatTableDataSource<Routing>(dnis);
    this.listDnisDataSource.filterPredicate = (data: Routing, filter: string) => {
      return data.dnis.includes(filter);
    };
    this.listDnisDataSource.paginator = this.dnisPaginator;
  }

  private updateDataSourceForClid(clid: Routing[]) {
    this.listClidDataSource = new MatTableDataSource<Routing>(clid);
    this.listClidDataSource.filterPredicate = (data: Routing, filter: string) => {
      return data.clid.includes(filter);
    };
    this.listClidDataSource.paginator = this.clidPaginator;
  }
}
