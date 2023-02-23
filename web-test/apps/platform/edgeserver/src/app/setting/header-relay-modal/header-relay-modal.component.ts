import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HeaderRelayProfile, HeaderRelayService, PreConfig } from '@b3networks/api/edgeserver';
import { finalize } from 'rxjs/operators';

export interface HeaderRelayModalInput {
  isEdit: boolean;
  headerRelay: HeaderRelayProfile;
  headerRelays: HeaderRelayProfile[];
  preConfig: PreConfig;
  cluster: string;
}

@Component({
  selector: 'b3n-header-relay-modal',
  templateUrl: './header-relay-modal.component.html',
  styleUrls: ['./header-relay-modal.component.scss']
})
export class HeaderRelayModalComponent implements OnInit {
  formGroup: UntypedFormGroup;
  isLoading: boolean;
  headerRelaysSource: string[] = [];
  selectedDropHeaderRelays: string[] = [];
  headerRelayModalInput: HeaderRelayModalInput;

  get name() {
    return this.formGroup.get('name');
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: HeaderRelayModalInput,
    private fb: UntypedFormBuilder,
    private headerRelayService: HeaderRelayService,
    private dialogRef: MatDialogRef<HeaderRelayModalComponent>
  ) {
    this.headerRelayModalInput = this.data;
    this.headerRelaysSource = [...this.data?.preConfig?.headers];
    this.initForm();
  }

  ngOnInit(): void {}

  onSave() {
    if (this.formGroup.invalid || !this.selectedDropHeaderRelays.length) {
      return;
    }

    const request: HeaderRelayProfile = {
      name: this.name.value,
      headers: this.selectedDropHeaderRelays
    };

    if (this.headerRelayModalInput?.isEdit) {
      this.updateHeaderRelayProfile(request);
      return;
    }
    this.createHeaderRelayProfile(request);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  private updateHeaderRelayProfile(request: HeaderRelayProfile) {
    this.isLoading = true;
    this.headerRelayService
      .updateHeaderRelayProfile(request, this.headerRelayModalInput.cluster)
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

  private createHeaderRelayProfile(request: HeaderRelayProfile) {
    this.isLoading = true;
    this.headerRelayService
      .createHeaderRelayProfile(request, this.headerRelayModalInput.cluster)
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

  private initForm() {
    const { isEdit, preConfig, headerRelay } = this.headerRelayModalInput;
    this.selectedDropHeaderRelays = isEdit ? [...this.data.headerRelay?.headers] : [preConfig?.headers[0]];
    this.initHeaderRelaysData();
    this.formGroup = this.fb.group({
      name: [
        isEdit ? { value: headerRelay?.name, disabled: true } : '',
        [
          Validators.required,
          Validators.pattern(preConfig?.pattern?.name),
          this.checkExistsHeaderRelaysValidator.bind(this)
        ]
      ]
    });
  }

  private initHeaderRelaysData() {
    if (this.headerRelaysSource.length) {
      const headerRelaysOrigin = [...this.headerRelaysSource];
      headerRelaysOrigin.forEach(element => {
        if (this.selectedDropHeaderRelays.indexOf(element) > -1) {
          this.headerRelaysSource.splice(this.headerRelaysSource.indexOf(element), 1);
        }
      });
    }
  }

  private checkExistsHeaderRelaysValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const { headerRelays } = this.headerRelayModalInput;

    let namesHeaderRelay = [];
    if (headerRelays?.length) {
      namesHeaderRelay = headerRelays.map(relay => relay.name);
    }

    if (namesHeaderRelay.indexOf(control.value?.toString()) > -1) {
      return { isExistsHeaderRelay: true };
    }
    return null;
  }
}
