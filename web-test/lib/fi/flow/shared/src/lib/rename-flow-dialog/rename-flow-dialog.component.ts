import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaCreatorService, Flow, FlowActionReq, FlowService } from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ValidateStringMaxLength } from '../app-state/app-state.model';
import { Utils } from '../utils';

export interface RenameFlowDialogReq {
  uuid: string;
  version: number;
  name: string;
  type: 'NORMAL' | 'SUBROUTINE' | 'BUSINESS_ACTION';
  presentName: string;
}

@Component({
  selector: 'b3n-rename-flow-dialog',
  templateUrl: './rename-flow-dialog.component.html',
  styleUrls: ['./rename-flow-dialog.component.scss']
})
export class RenameFlowDialogComponent implements OnInit {
  updating: boolean;
  nameCtrl = new UntypedFormControl(
    '',
    Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
  );
  presentNameCtrl = new UntypedFormControl(
    '',
    Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
  );
  getError = (ctrl: UntypedFormControl) => Utils.getErrorInput(ctrl);

  constructor(
    @Inject(MAT_DIALOG_DATA) public flow: RenameFlowDialogReq,
    private dialogRef: MatDialogRef<RenameFlowDialogComponent>,
    private flowService: FlowService,
    private baCreatorService: BaCreatorService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.nameCtrl.setValue(this.flow.name);
    if (this.flow.type === 'BUSINESS_ACTION') {
      this.presentNameCtrl.setValue(this.flow.presentName);
    }
  }

  private editName() {
    return this.flowService.renameFlow(
      <FlowActionReq>{
        flowUuid: this.flow.uuid,
        version: this.flow.version
      },
      this.nameCtrl.value
    );
  }

  private editPresentName() {
    return this.baCreatorService.editBaCreator(this.flow.uuid, this.flow.version, {
      presentName: this.presentNameCtrl.value
    });
  }

  rename() {
    const linkApi: Observable<Flow>[] = [];
    if (this.flow.type === 'BUSINESS_ACTION') {
      if (this.nameCtrl.valid && this.presentNameCtrl.valid) {
        linkApi.push(this.editName());
        linkApi.push(this.editPresentName());
      }
    } else {
      if (this.nameCtrl.valid) {
        linkApi.push(this.editName());
      }
    }

    if (linkApi.length > 0) {
      this.updating = true;
      forkJoin(linkApi)
        .pipe(finalize(() => (this.updating = false)))
        .subscribe({
          next: () => {
            this.toastService.success('Edit name successfully');
            this.dialogRef.close(true);
          },
          error: err => this.toastService.error(err.message)
        });
    }
  }
}
