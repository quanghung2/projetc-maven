import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ApprovalWorkspaceService, SubmitFormRequest } from '@b3networks/api/approval';
import { IMessComponent } from '@b3networks/api/workspace';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'csh-interactive-button',
  templateUrl: './interactive-button.component.html',
  styleUrls: ['./interactive-button.component.scss']
})
export class InteractiveButtonComponent implements OnChanges {
  @Input() messageId: string;
  @Input() component: IMessComponent;

  @Output() closeDialog = new EventEmitter<boolean>();

  errorText: string;
  isProgressing: boolean;
  isColorMaterial: boolean;

  constructor(private approvalWorkspaceService: ApprovalWorkspaceService, private toastService: ToastService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['component']) {
      this.errorText = !this.component?.label ? 'Unrenderable button!' : null;
      this.isColorMaterial = ['primary', 'accent', 'warn'].includes(this.component?.color);
    }
  }

  onClick() {
    this.isProgressing = true;
    const body = <SubmitFormRequest>{ payload: {}, mid: this.messageId };
    this.approvalWorkspaceService
      .submitFormComponent(this.component.action_url, body)
      .pipe(finalize(() => (this.isProgressing = false)))
      .subscribe({
        next: () => {
          this.closeDialog.emit(true);
        },
        error: err => this.toastService.error(err.message)
      });
  }
}
