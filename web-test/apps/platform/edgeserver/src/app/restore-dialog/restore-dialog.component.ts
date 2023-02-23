import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Cluster, ClusterQuery, EdgeDbService } from '@b3networks/api/edgeserver';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-restore-dialog',
  templateUrl: './restore-dialog.component.html',
  styleUrls: ['./restore-dialog.component.scss']
})
export class RestoreDialogComponent extends DestroySubscriberComponent implements OnInit {
  clusters$: Observable<Cluster[]>;
  clusterCtrl = new UntypedFormControl();
  importing: boolean;
  strJson: string;

  constructor(
    private dialogRef: MatDialogRef<RestoreDialogComponent>,
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

  async chooseFile(event) {
    if (this.importing) {
      return;
    }
    this.importing = true;
    const file = event.target.files.item(0);
    this.strJson = await file.text();
    this.importing = false;
  }

  restore() {
    this.importing = true;
    this.edgedbService
      .restore(this.clusterCtrl.value, this.strJson)
      .pipe(finalize(() => (this.importing = false)))
      .subscribe(
        _ => {
          this.toastService.success('Restore successfully');
          this.dialogRef.close();
        },
        err => this.toastService.error(err.message)
      );
  }
}
