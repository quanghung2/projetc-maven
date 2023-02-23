import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChannelService, UpdateChannelReq } from '@b3networks/api/workspace';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { SupportedConvo } from '../../core/adapter/convo-helper.service';

export class MyErrorStateMatcher2 implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
}

@Component({
  selector: 'csh-rename-conversation',
  templateUrl: './rename-conversation.component.html',
  styleUrls: ['./rename-conversation.component.scss']
})
export class RenameConversationComponent implements OnInit {
  saving: boolean;
  textField: UntypedFormControl;
  matcher = new MyErrorStateMatcher2();

  constructor(
    private fb: UntypedFormBuilder,
    private channelService: ChannelService,
    @Inject(MAT_DIALOG_DATA) public data: SupportedConvo,
    private dialogRef: MatDialogRef<RenameConversationComponent>,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.textField = this.fb.control(this.data.name, [Validators.required]);
  }

  submit() {
    if (this.textField.value && !this.saving) {
      this.saving = true;
      this.channelService
        .updateNameOrDescriptionChannel(this.data.id, <UpdateChannelReq>{
          name: this.textField.value
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe(
          _ => this.dialogRef.close(),
          err => {
            if (err === 'already-exists') {
              this.toastService.error('Channel already exists');
            } else if (err === 'invalid input') {
              this.toastService.error("Channel name can't contain spaces, #, periods, or most punctuation.");
            } else {
              this.toastService.error(err || err?.message);
            }
          }
        );
    }
  }
}
