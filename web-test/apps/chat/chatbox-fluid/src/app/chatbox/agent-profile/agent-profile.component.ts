import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Profile } from '@b3networks/api/auth';
import { UIConfig } from '@b3networks/api/callcenter';
import { Viewing } from '../chatbox.component';

@Component({
  selector: 'b3n-agent-profile',
  templateUrl: './agent-profile.component.html',
  styleUrls: ['./agent-profile.component.scss']
})
export class AgentProfileComponent implements OnInit {
  @Input() ui: UIConfig;
  @Input() profileAgent: Profile;
  @Input() viewing: Viewing;

  @Output() navigateForm = new EventEmitter();

  readonly Viewing = Viewing;
  constructor() {}

  ngOnInit(): void {}

  nextView() {
    this.navigateForm.emit(true);
  }
}
