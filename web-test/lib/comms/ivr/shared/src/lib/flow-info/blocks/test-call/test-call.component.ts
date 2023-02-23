import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Block, TtsConfig, TtsService } from '@b3networks/api/ivr';
import { finalize } from 'rxjs/operators';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-test-call',
  templateUrl: './test-call.component.html',
  styleUrls: ['./test-call.component.scss']
})
export class TestCallComponent implements OnInit {
  dest: string;
  calling: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Block,
    private ttsService: TtsService,
    private toastService: ToastService
  ) {}

  ngOnInit() {}

  playMessageByPhoneCall() {
    this.calling = true;
    const tts: TtsConfig = new TtsConfig(this.data.tts.entries[0]);

    this.ttsService
      .testPlayMessageByPhoneCall(this.dest, tts)
      .pipe(finalize(() => (this.calling = false)))
      .subscribe(
        () => {
          this.calling = false;
          this.toastService.success('Called successfully!');
        },
        error => {
          this.toastService.error('Cannot call number. Please try  agian later!');
        }
      );
  }
}
