import { Component, OnInit, ViewChild } from '@angular/core';
import { CallRecordingAction, Extension, SpeechEntry, Text2Speech, Text2SpeechEntry } from '@b3networks/api/bizphone';
import { ExtensionQuery, ExtensionService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { TtsConfigComponent } from 'libs/comms/shared/src/lib/component/tts-config/tts-config.component';
import { cloneDeep } from 'lodash';
import { Observable } from 'rxjs';
import { filter, finalize, map, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-call-recordings',
  templateUrl: './call-recordings.component.html',
  styleUrls: ['./call-recordings.component.scss']
})
export class CallRecordingsComponent implements OnInit {
  extension$: Observable<Extension>;
  @ViewChild('TtsConfig') TtsConfig: TtsConfigComponent;

  incomingTts: Text2SpeechEntry;
  outgoingTts: Text2SpeechEntry;
  saving: boolean;
  isValidInput = false;

  readonly CrAction = CallRecordingAction;

  constructor(
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.extension$ = this.extensionQuery.selectActive().pipe(
      filter(ext => ext != null && ext instanceof Extension),
      map(ext => new Extension(cloneDeep(ext))),
      // takeUntil(this.destroySubscriber$),
      tap(ext => {
        this.incomingTts = ext.crConfig.incomingTts.entries[0] || new SpeechEntry();
        this.outgoingTts = ext.crConfig.outgoingTts.entries[0] || new SpeechEntry();
      })
    );
  }

  ttsChanged(event: Text2SpeechEntry, msg: Text2Speech) {
    if (!msg) {
      msg = new Text2Speech();
    }
    msg.entries = [];
    msg.entries.push(event);
    setTimeout(() => {
      this.isValidInput = !!this.TtsConfig?.ttsFormGroup?.invalid;
    });
  }

  onSave(ext: Extension) {
    this.saving = true;
    this.extensionService
      .update(ext.extKey, { crConfig: ext.crConfig })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(_ => this.toastService.success('Apply Successfully!'));
  }
}
