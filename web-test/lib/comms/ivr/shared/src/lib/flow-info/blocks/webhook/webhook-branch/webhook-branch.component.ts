import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { WebhookBranch } from '@b3networks/api/ivr';

@Component({
  selector: 'b3n-webhook-branch',
  templateUrl: './webhook-branch.component.html',
  styleUrls: ['./webhook-branch.component.scss']
})
export class WebhookBranchComponent implements OnInit {
  @Input() blockUuid: string;
  @Input() branch: WebhookBranch;
  @Output() triggerReloadBranchLabelEvent = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  constructBranchLabel() {
    this.triggerReloadBranchLabelEvent.emit();
  }
}
