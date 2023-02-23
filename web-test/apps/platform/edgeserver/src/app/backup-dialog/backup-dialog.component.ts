import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Cluster, ClusterQuery, EdgeDbService } from '@b3networks/api/edgeserver';
import { DestroySubscriberComponent, downloadData } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-backup-dialog',
  templateUrl: './backup-dialog.component.html',
  styleUrls: ['./backup-dialog.component.scss']
})
export class BackupDialogComponent extends DestroySubscriberComponent implements OnInit {
  clusters$: Observable<Cluster[]>;
  clusterCtrl = new UntypedFormControl();

  constructor(
    private dialogRef: MatDialogRef<BackupDialogComponent>,
    private clusterQuery: ClusterQuery,
    private edgedbService: EdgeDbService,
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
        this.clusterCtrl.setValue(cluster.cluster);
      });
  }

  backup() {
    this.edgedbService.backup(this.clusterCtrl.value).subscribe(
      res => {
        downloadData(res, `${this.clusterCtrl.value}-backup-${new Date().toISOString().slice(0, 10)}.json`);
        this.dialogRef.close();
      },
      err => this.toastService.error(err.message)
    );
  }
}
