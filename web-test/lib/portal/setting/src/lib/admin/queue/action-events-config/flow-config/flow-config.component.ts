import { KeyValue } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Extension } from '@b3networks/api/bizphone';
import {
  QueueInfo,
  RedirectType,
  ThresholdAction,
  ThresholdConfig,
  Transfer2GenieConfig,
  TtsConfig
} from '@b3networks/api/callcenter';
import { SkillCatalog } from '@b3networks/api/intelligence';
import { EnumTypeActionEvent } from '../action-events-config.component';
import { GenieConfigComponent } from '../genie-config/genie-config.component';

@Component({
  selector: 'b3n-flow-config',
  templateUrl: './flow-config.component.html',
  styleUrls: ['./flow-config.component.scss']
})
export class FlowConfigComponent implements OnInit {
  @ViewChild(GenieConfigComponent) genieComp: GenieConfigComponent;
  @Input() flowConfig: ThresholdConfig;
  @Input() key: EnumTypeActionEvent;
  @Input() hangupMessage: TtsConfig;
  @Input() queues: QueueInfo[];
  @Input() extensions: Extension[];
  @Input() skills: SkillCatalog[];
  @Input() formParents: UntypedFormGroup;

  tab: number;
  enumAction = ThresholdAction;
  enumActionEvent = EnumTypeActionEvent;

  thresholdActions: KeyValue<ThresholdAction, string>[] = [
    { key: ThresholdAction.hangup, value: 'Hangup' },
    { key: ThresholdAction.callback, value: 'Callback' }
    // { key: ThresholdAction.genie, value: 'Genie' }
    // { key: ThresholdAction.redirect, value: 'Redirect' }
  ];

  redirectTypes: KeyValue<RedirectType, string>[] = [
    { key: RedirectType.number, value: 'Phone Number' },
    { key: RedirectType.extension, value: 'Extension' },
    { key: RedirectType.queue, value: 'Queue' }
  ];

  constructor() {}

  ngOnInit() {
    if (this.flowConfig.redirectTo.type === RedirectType.number) {
      this.tab = 0;
    } else if (this.flowConfig.redirectTo.type === RedirectType.extension) {
      this.tab = 1;
    } else if (this.flowConfig.redirectTo.type === RedirectType.queue) {
      this.tab = 2;
    }

    if (
      !this.flowConfig.genieConfig ||
      (this.flowConfig.genieConfig && Object.entries(this.flowConfig.genieConfig).length === 0)
    ) {
      this.flowConfig.genieConfig = new Transfer2GenieConfig(null);
    }
  }

  tabChange(event: MatTabChangeEvent) {
    if (event.index === 0) {
      this.flowConfig.redirectTo.type = RedirectType.number;
    } else if (event.index === 1) {
      this.flowConfig.redirectTo.type = RedirectType.extension;
    } else if (event.index === 2) {
      this.flowConfig.redirectTo.type = RedirectType.queue;
    }
  }
}
