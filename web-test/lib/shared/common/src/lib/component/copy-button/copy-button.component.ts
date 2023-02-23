import { Component, Input } from '@angular/core';
import { ToastService } from '@b3networks/shared/ui/toast';

export interface CopyClipboardOptions {
  successMessage: string;
  faildMessage: string;
}

@Component({
  selector: 'shc-copy-button',
  templateUrl: './copy-button.component.html',
  styleUrls: ['./copy-button.component.scss']
})
export class CopyButtonComponent {
  @Input() tooltip: string;
  @Input() text: string;
  @Input() limitContentLength = 8;

  @Input() options: CopyClipboardOptions = <CopyClipboardOptions>{
    successMessage: 'Copied to clipboard!',
    faildMessage: 'Fail to copy to clipboard!'
  };

  constructor(private toastService: ToastService) {}

  copied() {
    this.toastService.success(this.options.successMessage);
  }

  copyFail() {
    this.toastService.error(this.options.faildMessage);
  }
}
