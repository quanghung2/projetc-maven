import { Component, EventEmitter, Output } from '@angular/core';
import { BaCreatorService, BodyParameter, CreateNewBaCreatorReq, FlowQuery } from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-create-bacreator',
  templateUrl: './create-bacreator.component.html',
  styleUrls: ['./create-bacreator.component.scss']
})
export class CreateBaCreatorComponent {
  @Output() onClose = new EventEmitter<boolean>();

  invalid: boolean;
  parameters: BodyParameter[] = [];
  creating: boolean;

  constructor(
    private flowQuery: FlowQuery,
    private baCreatorService: BaCreatorService,
    private toastService: ToastService
  ) {}

  createBac() {
    const flow = this.flowQuery.getValue();
    if (!this.invalid) {
      this.creating = true;
      this.baCreatorService
        .createBaCreator(<CreateNewBaCreatorReq>{
          flowUuid: flow.uuid,
          flowVersion: flow.version,
          input: {
            parameters: this.parameters
          }
        })
        .pipe(finalize(() => (this.creating = false)))
        .subscribe({
          next: () => {
            this.toastService.success('Business action has been created');
            this.onClose.emit(true);
          },
          error: err => this.toastService.error(err.message)
        });
    }
  }
}
