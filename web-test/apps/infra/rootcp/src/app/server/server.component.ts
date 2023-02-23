import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Server, ServerService } from '@b3networks/api/edgeserver';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import Fuse from 'fuse.js';
import { debounceTime, finalize } from 'rxjs/operators';
import { CreateServerDialogComponent } from './create-server-dialog/create-server-dialog.component';
import { DetailServerDialogComponent } from './detail-server-dialog/detail-server-dialog.component';

export interface Provision {
  cluster: string;
  servers: Server[];
}

@Component({
  selector: 'b3n-server',
  templateUrl: './server.component.html',
  styleUrls: ['./server.component.scss']
})
export class ServerComponent implements OnInit {
  searchCtrl = new UntypedFormControl();
  filterCtrl = new UntypedFormControl();

  list: Provision[];
  loading: boolean;
  filteredServers: Provision[] = [];

  constructor(private dialog: MatDialog, private serverService: ServerService, private toastService: ToastService) {}

  ngOnInit(): void {
    this.filterCtrl.valueChanges.pipe(debounceTime(300)).subscribe(str => {
      if (str.trim() == '') {
        this.filteredServers = this.list;
      } else {
        const result = [];
        this.list.forEach((p: Provision) => {
          const options = { keys: ['cluster', 'nodeName'], threshold: 0.1 };
          const fuse = new Fuse(p.servers, options);
          const data = fuse.search(str == '' ? ' ' : str).map(r => r.item);
          if (data.length > 0) {
            const newProvision: Provision = { cluster: p.cluster, servers: p.servers };
            result.push(newProvision);
          }
        });
        this.filteredServers = result;
      }
    });
  }

  loadData() {
    this.loading = true;
    if (this.list) {
      this.list.length = 0;
    } else {
      this.list = [];
    }
    this.serverService
      .getProvision(this.searchCtrl.value)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        servers => {
          const clusters = [...new Set(servers.map(s => s.cluster))];
          clusters.forEach(c => {
            this.list.push({ cluster: c, servers: servers.filter(s => s.cluster == c) });
          });
          this.filteredServers = this.list;
        },
        err => this.toastService.error(err.message)
      );
  }

  createServer() {
    this.dialog
      .open(CreateServerDialogComponent, {
        width: '500px',
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.loadData();
        }
      });
  }

  detailServer(server: Server) {
    this.dialog.open(DetailServerDialogComponent, {
      width: '400px',
      disableClose: true,
      data: server
    });
  }

  deleteServer(server: Server) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '300px',
        disableClose: true,
        data: <ConfirmDialogInput>{
          title: 'Confirm',
          message: `Are you want to delete this server?`,
          confirmLabel: 'Delete',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(accepted => {
        if (accepted) {
          this.serverService.deleteServer(server).subscribe(_ => {
            this.toastService.success(`Delete server successfully.`);
            this.loadData();
          });
        }
      });
  }
}
