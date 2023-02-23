import { Component, EventEmitter, Output } from '@angular/core';
import { CreateSubroutineReq, FlowQuery, SubroutineService } from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-create-subroutine',
  templateUrl: './create-subroutine.component.html',
  styleUrls: ['./create-subroutine.component.scss']
})
export class CreateSubroutineComponent {
  @Output() onClose = new EventEmitter<boolean>();

  invalid: boolean;
  configs: CreateSubroutineReq;
  creating: boolean;

  constructor(
    private flowQuery: FlowQuery,
    private subroutineService: SubroutineService,
    private toastService: ToastService
  ) {}

  createSubroutine() {
    const flow = this.flowQuery.getValue();
    if (!this.invalid) {
      this.creating = true;
      this.subroutineService
        .createSubroutine(<CreateSubroutineReq>{
          flowUuid: flow.uuid,
          flowVersion: flow.version,
          input: this.configs.input,
          output: this.configs.output,
          autoInjectOngoingCallTxn: this.configs.autoInjectOngoingCallTxn
        })
        .pipe(finalize(() => (this.creating = false)))
        .subscribe({
          next: () => {
            this.toastService.success('Subroutine has been created');
            this.onClose.emit(true);
          },
          error: err => this.toastService.error(err.message)
        });
    }
  }
}
