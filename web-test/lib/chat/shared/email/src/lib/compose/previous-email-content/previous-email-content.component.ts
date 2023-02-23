import { Component, Input } from '@angular/core';
import { EmailMessageGeneral } from '@b3networks/api/workspace';

@Component({
  selector: 'b3n-previous-email-content',
  templateUrl: './previous-email-content.component.html',
  styleUrls: ['./previous-email-content.component.scss']
})
export class PreviousEmailContentComponent {
  @Input() textDisplay: string;
  @Input() msg: EmailMessageGeneral;
  @Input() noBorderBottom: boolean;
  @Input() isForward: boolean;
  @Input() date: Date;
  showPreviousEmail: boolean;
}
