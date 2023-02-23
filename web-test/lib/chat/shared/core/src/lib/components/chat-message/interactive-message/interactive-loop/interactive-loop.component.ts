import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { IMessComponent } from '@b3networks/api/workspace';
import { HashMap } from '@datorama/akita';
import { InfoShowMention } from '../../../../core/state/app-state.model';

@Component({
  selector: 'csh-interactive-loop',
  templateUrl: './interactive-loop.component.html',
  styleUrls: ['./interactive-loop.component.scss']
})
export class InteractiveLoopComponent implements OnChanges {
  @Input() messageId: string;
  @Input() isSection: boolean;
  @Input() components: IMessComponent[];
  @Input() isDialog: boolean;
  @Input() parent: IMessComponent;
  @Input() groupRoot: FormGroup; // of childrent
  @Input() uploadPercentageMap: HashMap<number> = {}; // id file -> number;
  @Input() uploadStatusMap: HashMap<boolean> = {};
  @Input() isSubmiting: boolean;

  @Output() showProfile: EventEmitter<InfoShowMention> = new EventEmitter<InfoShowMention>();
  @Output() closeDialog = new EventEmitter<boolean>();

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {}
}
