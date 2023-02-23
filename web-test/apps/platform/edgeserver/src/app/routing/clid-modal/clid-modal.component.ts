import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Context, CRURoutingReq, MATCHING, Peer, PreConfig, Routing, RoutingService } from '@b3networks/api/edgeserver';
import { finalize } from 'rxjs/operators';

export interface ClidModalInput {
  isEdit: boolean;
  preConfig: PreConfig;
  clidData: Routing;
  peers: Peer[];
  clidsData: Routing[];
  cluster: string;
}

@Component({
  selector: 'b3n-clid-modal',
  templateUrl: './clid-modal.component.html',
  styleUrls: ['./clid-modal.component.scss']
})
export class ClidModalComponent implements OnInit {
  readonly JUMTOCLID = '_jumptoclid';
  readonly PLANNAME = 'default';

  readonly matchings: KeyValue<MATCHING, string>[] = [
    { key: MATCHING.lpm, value: 'Longest prefix matching' },
    { key: MATCHING.em, value: 'Exactly matching' }
  ];

  clidModalInput: ClidModalInput;
  formGroup: UntypedFormGroup;
  isLoading: boolean;

  get tag() {
    return this.formGroup.get('tag');
  }

  get clid() {
    return this.formGroup.get('clid');
  }

  get matching() {
    return this.formGroup.get('matching');
  }

  get load() {
    return this.formGroup.get('load');
  }

  get peer1() {
    return this.formGroup.get('peer1');
  }

  get peer2() {
    return this.formGroup.get('peer2');
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: ClidModalInput,
    private fb: UntypedFormBuilder,
    private routingService: RoutingService,
    private dialogRef: MatDialogRef<ClidModalComponent>
  ) {
    this.clidModalInput = this.data;
    this.initFormData();
  }

  ngOnInit(): void {}

  onSave() {
    if (this.formGroup.invalid) {
      return;
    }

    const request: CRURoutingReq = {
      context: Context.inside,
      planname: this.PLANNAME
    };

    const body: Routing = {
      tag: this.tag.value,
      clid: this.clid.value?.toString(),
      matching: this.matching.value,
      peer1: this.peer1.value,
      peer2: this.peer2.value,
      load: this.load.value
    };

    this.isLoading = true;
    const { isEdit } = this.clidModalInput;
    if (isEdit) {
      this.updateClidRouting(request, body);
      return;
    }
    this.createClidRouting(request, body);
  }

  private createClidRouting(request: CRURoutingReq, body: Routing) {
    this.routingService
      .createClidRouting(request, body, this.clidModalInput.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.dialogRef.close({ success: true });
        },
        error => {
          this.dialogRef.close({ success: false, error });
        }
      );
  }

  private updateClidRouting(request: CRURoutingReq, body: Routing) {
    this.routingService
      .updateClidRouting(request, body, this.clidModalInput.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.dialogRef.close({ success: true });
        },
        error => {
          this.dialogRef.close({ success: false, error });
        }
      );
  }

  private initFormData() {
    const { clidData, isEdit, preConfig } = this.clidModalInput;
    if (isEdit) {
      this.formGroup = this.fb.group({
        tag: [
          { value: clidData?.tag, disabled: true },
          [Validators.required, Validators.pattern(preConfig?.pattern?.name)]
        ],
        clid: [{ value: clidData?.clid, disabled: true }, Validators.required],
        matching: [clidData?.matching],
        load: [clidData?.load, [Validators.required, Validators.min(0), Validators.max(100)]],
        peer1: [clidData?.peer1, Validators.required],
        peer2: [clidData?.peer2, Validators.required]
      });

      return;
    }

    this.formGroup = this.fb.group({
      tag: ['', [Validators.required, Validators.pattern(preConfig?.pattern?.name)]],
      clid: ['', Validators.required],
      matching: [this.matchings[0].key],
      load: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      peer1: ['', Validators.required],
      peer2: ['', Validators.required]
    });
  }
}
