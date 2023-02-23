import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ClusterQuery, PreConfig, PreConfigService, ServerService } from '@b3networks/api/edgeserver';
import { BackupDialogComponent } from './backup-dialog/backup-dialog.component';
import { DownloadCdrReportDialogComponent } from './download-cdr-report-dialog/download-cdr-report-dialog.component';
import { RestoreDialogComponent } from './restore-dialog/restore-dialog.component';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  readonly menus = [
    { url: '/trunk', title: 'Trunks' },
    { url: '/setting', title: 'Settings' },
    { url: '/routing', title: 'Routing' }
  ];

  preConfig: PreConfig;

  constructor(
    private dialog: MatDialog,
    private preConfigService: PreConfigService,
    private serverService: ServerService,
    private clusterQuery: ClusterQuery
  ) {}

  ngOnInit(): void {
    this.serverService.getServer().subscribe(_ => {
      this.preConfigService.getPreConfig(this.clusterQuery.getActive().cluster).subscribe(preconfig => {
        this.preConfig = preconfig;
      });
    });
  }

  backup() {
    this.dialog.open(BackupDialogComponent, {
      width: '400px',
      disableClose: true
    });
  }

  restore() {
    this.dialog.open(RestoreDialogComponent, {
      width: '400px',
      disableClose: true
    });
  }

  download() {
    this.dialog.open(DownloadCdrReportDialogComponent, {
      width: '300px',
      disableClose: true
    });
  }
}
