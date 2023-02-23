import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Cluster, ClusterQuery, DoNetCapReq, NetCapService, PreConfigQuery } from '@b3networks/api/edgeserver';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-create-netcap-modal',
  templateUrl: './create-netcap-modal.component.html',
  styleUrls: ['./create-netcap-modal.component.scss']
})
export class CreateNetcapModalComponent extends DestroySubscriberComponent implements OnInit {
  nodesDataSource: string[] = [];
  curCluster: Cluster;
  formCreateNetCap: UntypedFormGroup;
  creating: boolean;
  time: number;

  get tag(): UntypedFormControl {
    return this.formCreateNetCap.get('tag') as UntypedFormControl;
  }
  getErrorTag() {
    if (this.tag.hasError('required')) {
      return "Tag can't be empty";
    } else if (this.tag.hasError('pattern')) {
      return 'Tag is invalid';
    }
    return '';
  }

  get duration(): UntypedFormControl {
    return this.formCreateNetCap.get('duration') as UntypedFormControl;
  }
  getErrorDuration() {
    if (this.duration.hasError('required')) {
      return "Duration can't be empty";
    } else if (this.duration.hasError('min') || this.duration.hasError('max')) {
      return 'Duration must be from 10 to 300';
    }
    return '';
  }

  get nodes(): UntypedFormControl {
    return this.formCreateNetCap.get('nodes') as UntypedFormControl;
  }
  getErrorNodes() {
    return this.nodes.hasError('required') ? "Nodes can't be empty" : '';
  }

  get net(): UntypedFormControl {
    return this.formCreateNetCap.get('filters.net') as UntypedFormControl;
  }
  getErrorNet() {
    return this.net.hasError('pattern') ? 'Field is invalid' : '';
  }

  constructor(
    private dialogRef: MatDialogRef<CreateNetcapModalComponent>,
    private fb: UntypedFormBuilder,
    private netCapService: NetCapService,
    private clusterQuery: ClusterQuery,
    private preConfigQuery: PreConfigQuery,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.preConfigQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(preConfig => {
        Object.keys(preConfig.cluster).forEach(key => {
          this.nodesDataSource.push(key);
        });
      });

    this.clusterQuery
      .selectActive()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(cluster => {
        this.curCluster = cluster;
      });

    this.formCreateNetCap = this.fb.group({
      tag: ['netcap', Validators.compose([Validators.required, Validators.pattern('^[a-zA-Z][a-zA-Z0-9_]{0,31}$')])],
      duration: [30, Validators.compose([Validators.required, Validators.min(10), Validators.max(300)])],
      nodes: [['awsedge1'], Validators.required],
      filters: this.fb.group({
        net: [
          '',
          Validators.pattern(
            '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)((\\/([0-9]|[1-2][0-9]|[1-3][0-2]))|$)$'
          )
        ]
      })
    });
  }

  createNetCap() {
    if (this.formCreateNetCap.valid) {
      this.creating = true;
      this.formCreateNetCap.disable();

      const req: DoNetCapReq = this.formCreateNetCap.getRawValue();
      if (!this.net.value) {
        delete req.filters;
      }
      this.time = Number(this.duration.value);
      this.netCapService.doNetCap(req, this.curCluster.cluster).subscribe(
        res => {
          this.toastService.success('Capture network successfully');
          const time = this.time;
          let i = 0;
          const intr = setInterval(() => {
            this.time = time - i - 1;
            if (++i == time) {
              clearInterval(intr);
              this.creating = false;
              this.formCreateNetCap.enable();
              this.dialogRef.close(true);
            }
          }, 1000);
        },
        error => {
          this.toastService.error(error);
          this.creating = false;
          this.formCreateNetCap.enable();
        }
      );
    }
  }
}
