import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelectChange } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import {
  Cluster,
  ClusterQuery,
  ClusterService,
  CodecProfile,
  CodecService,
  HeaderRelayProfile,
  HeaderRelayService,
  ManipulationProfile,
  ManipulationService,
  Peer,
  PeerService,
  PreConfig,
  PreConfigQuery,
  PreConfigService,
  SecurityProfile,
  SecurityService,
  TranslationProfile,
  TranslationService
} from '@b3networks/api/edgeserver';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin, Observable } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { CreateTrunkModalComponent, CreateTrunkModalInput } from './create-trunk-modal/create-trunk-modal.component';

@Component({
  selector: 'b3n-trunk',
  templateUrl: './trunk.component.html',
  styleUrls: ['./trunk.component.scss']
})
export class TrunkComponent extends DestroySubscriberComponent implements OnInit {
  displayedColumns = ['name', 'direction', 'status', 'interface', 'action'];
  selectedDirection = new UntypedFormControl('all');
  searchTrunk = new UntypedFormControl('');

  isLoading: boolean;
  peers = new MatTableDataSource<Peer>();
  peersOrigin: Peer[] = [];
  codecs: CodecProfile[] = [];
  securitys: SecurityProfile[] = [];
  translations: TranslationProfile[] = [];
  manipulations: ManipulationProfile[] = [];
  preConfig: PreConfig;

  clusters$: Observable<Cluster[]>;
  curCluster: Cluster;
  headerRelays: HeaderRelayProfile[] = [];

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(
    private translationService: TranslationService,
    private securityService: SecurityService,
    private codecService: CodecService,
    private peerService: PeerService,
    private manipulationService: ManipulationService,
    private clusterService: ClusterService,
    private clusterQuery: ClusterQuery,
    private preConfigQuery: PreConfigQuery,
    private preConfigService: PreConfigService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private headerRelayService: HeaderRelayService
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
        forkJoin([
          this.codecService.getCodecProfile(this.curCluster.cluster),
          this.securityService.getSecurityProfile(this.curCluster.cluster),
          this.translationService.getTranslationProfile(this.curCluster.cluster),
          this.manipulationService.getManipulation(this.curCluster.cluster),
          this.headerRelayService.getHeaderRelayProfile(this.curCluster.cluster)
        ]).subscribe(
          data => {
            this.codecs = data[0];
            this.securitys = data[1];
            this.translations = data[2];
            this.manipulations = data[3];
            this.headerRelays = data[4];
          },
          error => {
            if (error[0]) this.toastService.error(error[0]);
            if (error[1]) this.toastService.error(error[1]);
            if (error[2]) this.toastService.error(error[2]);
            if (error[3]) this.toastService.error(error[3]);
            if (error[4]) this.toastService.error(error[4]);
          }
        );
      });

    this.preConfigQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(res => {
        this.preConfig = res;
        this.getPeer();
      });
  }

  getPeer() {
    this.isLoading = true;
    this.peerService
      .getPeer(this.curCluster.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          if (this.preConfig) {
            this.peersOrigin = res;
            this.updateDataSource(res);
          }
        },
        err => this.toastService.error(err)
      );
  }

  onShowCreateTrunk() {
    this.dialog
      .open(CreateTrunkModalComponent, {
        width: '100%',
        height: '100%',
        maxWidth: '100vw',
        maxHeight: '100vh',
        data: <CreateTrunkModalInput>{
          isEdit: false,
          securitys: this.securitys,
          codecs: this.codecs,
          preConfig: this.preConfig,
          translations: this.translations,
          peers: [...this.peersOrigin],
          manipulations: this.manipulations,
          headerRelays: this.headerRelays
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.getPeer();
          this.reset();
          this.toastService.success('Add Trunk successfully');
          return;
        }

        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  editTrunk(peer: Peer) {
    this.dialog
      .open(CreateTrunkModalComponent, {
        width: '100%',
        height: '100%',
        maxWidth: '100vw',
        maxHeight: '100vh',
        data: <CreateTrunkModalInput>{
          isEdit: true,
          securitys: this.securitys,
          codecs: this.codecs,
          peer: peer,
          preConfig: this.preConfig,
          translations: this.translations,
          peers: [...this.peersOrigin],
          manipulations: this.manipulations,
          headerRelays: this.headerRelays
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.getPeer();
          this.reset();
          this.toastService.success('Update Trunk successfully');
          return;
        }

        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  confirmDeleteTrunk(peer: Peer) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete Trunk',
          message: 'Are you sure you want to delete this trunk?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.deletePear(peer);
        }
      });
  }

  deletePear(peer: Peer) {
    this.peerService.deletePeer(peer.name, this.curCluster.cluster).subscribe(
      res => {
        this.getPeer();
        this.toastService.success('Delete trunk successfully');
        return;
      },
      err => this.toastService.error(err)
    );
  }

  onSearchTrunk(event) {
    this.selectedDirection.setValue('all');
    const text: string = event.target.value;
    const peers = [...this.peersOrigin];
    if (text?.trim().length) {
      const data = peers.filter(item => item.name?.toLowerCase().includes(text.toLowerCase()));
      this.updateDataSource(data);
      return;
    }

    this.updateDataSource(this.peersOrigin);
  }

  onChangeDirection(event: MatSelectChange) {
    this.searchTrunk.setValue('');
    const direction: string = event.value;
    const peers = [...this.peersOrigin];
    if (direction !== 'all') {
      const data = peers.filter(item => item.direction?.toLowerCase() === direction.toLowerCase());
      this.updateDataSource(data);
      return;
    }
    this.updateDataSource(this.peersOrigin);
  }

  onChangeCluster() {
    this.clusterService.selectCluster(this.curCluster);
    this.preConfigService.getPreConfig(this.curCluster.cluster).subscribe();
  }

  private reset() {
    this.searchTrunk.setValue('');
    this.selectedDirection.setValue('all');
  }

  private updateDataSource(peers: Peer[]) {
    const data = peers.sort((a, b) => {
      return ('' + a.interface).localeCompare(b.interface);
    });
    this.peers = new MatTableDataSource<Peer>(data);
    this.peers.paginator = this.paginator;
  }
}
