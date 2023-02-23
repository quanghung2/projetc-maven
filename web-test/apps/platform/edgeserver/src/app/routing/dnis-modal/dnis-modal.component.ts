import { KeyValue } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { Context, CRURoutingReq, MATCHING, Peer, PreConfig, Routing, RoutingService } from '@b3networks/api/edgeserver';
import { finalize } from 'rxjs/operators';

export interface DnisModalInput {
  isEdit: boolean;
  preConfig: PreConfig;
  dnisData: Routing;
  listDnisData: Routing[];
  peers: Peer[];
  clidsData: string[];
  cluster: string;
}

@Component({
  selector: 'b3n-dnis-modal',
  templateUrl: './dnis-modal.component.html',
  styleUrls: ['./dnis-modal.component.scss']
})
export class DnisModalComponent implements OnInit {
  readonly JUMTOCLID = '_jumptoclid';
  readonly PLANNAME = 'default';
  readonly matchings: KeyValue<MATCHING, string>[] = [
    { key: MATCHING.lpm, value: 'Longest prefix matching' },
    { key: MATCHING.em, value: 'Exactly matching' }
  ];
  readonly peerTypes: KeyValue<string, string>[] = [
    { key: this.PLANNAME, value: 'Default ' },
    { key: this.JUMTOCLID, value: 'CLID routing' }
  ];

  get dnis() {
    return this.formGroup.get('dnis');
  }

  get matching() {
    return this.formGroup.get('matching');
  }

  get peerType() {
    return this.formGroup.get('peerType');
  }

  get load() {
    return this.formGroup.get('load');
  }

  get tag() {
    return this.formGroup.get('tag');
  }

  get peer1() {
    return this.formGroup.get('peer1');
  }

  get peer2() {
    return this.formGroup.get('peer2');
  }

  dnisModalInput: DnisModalInput;
  isLoading: boolean;
  formGroup: UntypedFormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: DnisModalInput,
    private fb: UntypedFormBuilder,
    private routingService: RoutingService,
    private dialogRef: MatDialogRef<DnisModalComponent>,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.dnisModalInput = this.data;
    this.initFormData();
  }

  ngOnInit(): void {}

  onChangeTypePeer(event: MatRadioChange) {
    if (event.value === this.peerTypes[0].key) {
      this.peer1.setValidators(Validators.required);
      this.peer2.setValidators(Validators.required);
      this.load.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      this.tag.setErrors(null);
    } else {
      this.peer1.setErrors(null);
      this.peer2.setErrors(null);
      this.load.setErrors(null);
      this.tag.setValidators(Validators.required);
    }

    this.changeDetectorRef.detectChanges();
  }

  onSave() {
    if (this.formGroup.invalid) {
      return;
    }

    const request: CRURoutingReq = {
      context: Context.inside,
      planname: this.PLANNAME
    };

    const body: Routing = {
      dnis: this.dnis.value?.toString(),
      matching: this.matching.value,
      peer1: this.peerType.value !== this.peerTypes[0].key ? `${this.JUMTOCLID}-${this.tag.value}` : this.peer1.value,
      peer2: this.peerType.value !== this.peerTypes[0].key ? `${this.JUMTOCLID}-${this.tag.value}` : this.peer2.value,
      load: this.peerType.value !== this.peerTypes[0].key ? 100 : this.load.value,
      tag: this.tag.value
    };

    const { isEdit } = this.dnisModalInput;
    this.isLoading = true;
    if (isEdit) {
      this.updateDnisRouting(request, body);
      return;
    }

    this.createDnisRouting(request, body);
  }

  private createDnisRouting(request: CRURoutingReq, body: Routing) {
    this.routingService
      .createDnisRouting(request, body, this.dnisModalInput.cluster)
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

  private updateDnisRouting(request: CRURoutingReq, body: Routing) {
    this.routingService
      .updateDnisRouting(request, body, this.dnisModalInput.cluster)
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
    const { dnisData, isEdit } = this.dnisModalInput;

    if (!isEdit) {
      this.formGroup = this.fb.group({
        dnis: ['', [Validators.required, this.checkExistsDnisValidator.bind(this)]],
        matching: [this.matchings[0].key],
        peerType: [this.peerTypes[0].key],
        load: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
        tag: [''],
        peer1: ['', Validators.required],
        peer2: ['', Validators.required]
      });

      return;
    }

    const isJump = dnisData?.peer1?.indexOf(this.JUMTOCLID) > -1;

    this.formGroup = this.fb.group({
      dnis: [{ value: dnisData?.dnis, disabled: true }, Validators.required],
      matching: [dnisData?.matching],
      peerType: [isJump ? this.peerTypes[1].key : this.peerTypes[0].key],
      load: [dnisData?.load, isJump ? null : [Validators.required, Validators.min(0), Validators.max(100)]],
      tag: [isJump ? dnisData.peer2.substring(dnisData.peer2.indexOf('-') + 1, dnisData.peer2.length) : ''],
      peer1: [dnisData?.peer1],
      peer2: [dnisData?.peer2]
    });
  }

  private checkExistsDnisValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const listDnisData = [...(this.dnisModalInput?.listDnisData || [])];
    let dnisID = [];
    if (listDnisData && listDnisData.length) {
      dnisID = listDnisData.map(item => item.dnis);
    }

    if (dnisID.indexOf(control.value?.toString()) > -1) {
      return { isExistsDnis: true };
    }
    return null;
  }
}
