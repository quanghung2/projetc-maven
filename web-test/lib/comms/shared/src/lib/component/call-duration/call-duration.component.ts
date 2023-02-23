import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { DeviceType, Extension, MailBoxAction, Text2Speech, Text2SpeechEntry } from '@b3networks/api/bizphone';
import { ExtensionQuery } from '@b3networks/api/callcenter';
import { Flow } from '@b3networks/api/flow';
import { MeQuery } from '@b3networks/api/license';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { cloneDeep } from 'lodash';
import { filter, map, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-call-duration',
  templateUrl: './call-duration.component.html',
  styleUrls: ['./call-duration.component.scss']
})
export class CallDurationComponent extends DestroySubscriberComponent implements OnInit {
  @Input() fg: UntypedFormGroup;
  @Input() title: string;
  @Input() actions: KeyValue<string, string>[];
  @Input() hasTts = true;
  @Input() highlightTitle = true;
  @Input() selectUpward: boolean;
  @Input() flows: Flow[] = [];
  @Output() ttsChanged = new EventEmitter<{ event: Text2SpeechEntry; msg: Text2Speech }>();
  @Input() isMobileApp: boolean;

  delegated: boolean;

  readonly actionsToShowTTS = [MailBoxAction.RECORD_VOICEMAIL, MailBoxAction.HANGUP_WITH_MSG];

  trackActionId(idx, i: KeyValue<string, string>) {
    return i.key;
  }

  constructor(private extensionQuery: ExtensionQuery, private meLicenseQuery: MeQuery) {
    super();
  }

  ngOnInit(): void {
    this.extensionQuery
      .selectActive()
      .pipe(
        filter(ext => ext != null && ext instanceof Extension),
        map(ext => new Extension(cloneDeep(ext))),
        takeUntil(this.destroySubscriber$),
        tap(ext => {
          this.delegated = !!ext.devices.filter(d => d.deviceType === DeviceType.DELEGATED).length;

          if (!this.delegated) {
            return;
          }

          this.actions = this.actions.filter(a => a.key !== MailBoxAction.CALL_DELEGATION);
        })
      )
      .subscribe();
  }

  isAction(action: string) {
    return this.fg.controls['action']?.value === MailBoxAction[action];
  }

  change(event: Text2SpeechEntry, msg: Text2Speech) {
    this.ttsChanged.emit({ event, msg });
  }
}
