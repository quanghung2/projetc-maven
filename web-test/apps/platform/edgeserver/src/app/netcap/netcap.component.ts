import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  Cluster,
  ClusterQuery,
  ClusterService,
  NetCap,
  NetCapService,
  PreConfigService
} from '@b3networks/api/edgeserver';
import { DestroySubscriberComponent, downloadData } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { CreateNetcapModalComponent } from './create-netcap-modal/create-netcap-modal.component';

@Component({
  selector: 'b3n-netcap',
  templateUrl: './netcap.component.html',
  styleUrls: ['./netcap.component.scss']
})
export class NetcapComponent extends DestroySubscriberComponent implements OnInit {
  clusters$: Observable<Cluster[]>;
  tags: string[];
  nodes: string[];
  curCluster: Cluster;
  curTag: string = '';
  curNode: string = '';

  displayedColumns = ['fileName', 'tag', 'node', 'duration', 'starttime', 'action'];
  isLoading: boolean;
  netCapsSrc: NetCap[];
  netCapsFilter: NetCap[];
  netCaps = new MatTableDataSource<NetCap>();
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(
    private dialog: MatDialog,
    private clusterService: ClusterService,
    private clusterQuery: ClusterQuery,
    private preConfigService: PreConfigService,
    private netCapService: NetCapService,
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
        this.getNetCap();
      });
  }

  onChangeCluster() {
    this.clusterService.selectCluster(this.curCluster);
    this.preConfigService.getPreConfig(this.curCluster.cluster).subscribe();
  }

  filter() {
    this.netCapsFilter = this.netCapsSrc;
    if (this.curTag != '') {
      this.netCapsFilter = this.netCapsSrc.filter(n => n.tag == this.curTag);
    }
    if (this.curNode != '') {
      this.netCapsFilter = this.netCapsFilter.filter(n => n.node == this.curNode);
    }
    this.setDts(this.netCapsFilter);
  }

  private setDts(netCaps: NetCap[]) {
    const data = netCaps.sort((a, b) => {
      return new Date(b.starttime).getTime() - new Date(a.starttime).getTime();
    });
    this.netCaps = new MatTableDataSource<NetCap>(data);
    this.netCaps.paginator = this.paginator;
  }

  getNetCap() {
    this.isLoading = true;
    this.netCapService
      .getNetCap(this.curCluster.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          let data: NetCap[] = [];
          Object.keys(res).forEach(key => {
            data = data.concat(res[key]);
          });
          this.netCapsSrc = data;
          this.netCapsFilter = data;
          this.setDts(data);

          this.curTag = '';
          this.curNode = '';
          this.tags = [...new Set(data.map(i => i.tag))];
          this.nodes = Object.keys(res);
        },
        err => this.toastService.error(err)
      );
  }

  doNetCap() {
    this.dialog
      .open(CreateNetcapModalComponent, {
        width: '400px',
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.getNetCap();
        }
      });
  }

  download(netcap: NetCap) {
    this.netCapService.downloadNetCap(netcap.filename, this.curCluster.cluster, netcap.node).subscribe(
      res => downloadData(res, `${netcap.filename}.pcap`),
      err => this.toastService.error(err)
    );
  }

  delete(netcap: NetCap) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete Netcap',
          message: 'Are you sure you want to delete this netcap?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.netCapService.deleteNetCap(netcap.filename, this.curCluster.cluster).subscribe(
            res => {
              this.toastService.success('Delete trunk successfully');
              this.getNetCap();
            },
            err => this.toastService.error(err)
          );
        }
      });
  }
}
