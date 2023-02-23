import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OtherService } from '@b3networks/api/cp';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-mapping-tool-dialog',
  templateUrl: './mapping-tool-dialog.component.html',
  styleUrls: ['./mapping-tool-dialog.component.scss']
})
export class MappingToolDialogComponent implements OnInit {
  txnCtrl = new UntypedFormControl('', Validators.required);
  loading: boolean;
  stringBlob: string;
  source: SafeResourceUrl;

  constructor(
    private sanitizer: DomSanitizer,
    private otherService: OtherService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  view() {
    if (this.txnCtrl.valid) {
      this.loading = true;
      this.otherService
        .reconciliationTrace(this.txnCtrl.value)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(
          blob => {
            this.stringBlob = URL.createObjectURL(blob);
            this.source = this.sanitizer.bypassSecurityTrustResourceUrl(this.stringBlob);
          },
          err => this.toastService.error(err)
        );
    }
  }

  viewFull() {
    window.open(this.stringBlob, '_blank');
  }
}
