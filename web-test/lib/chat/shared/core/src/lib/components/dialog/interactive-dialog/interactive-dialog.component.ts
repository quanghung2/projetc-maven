import { Component, ElementRef, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Channel, ChatMessage, IMessBodyData, IMessComponent } from '@b3networks/api/workspace';
import { InfoShowMention } from '../../../core/state/app-state.model';
import { AppService } from '../../../core/state/app.service';

export interface InteractiveDialogData {
  message: ChatMessage;
  channel: Channel;
}

@Component({
  selector: 'csh-interactive-dialog',
  templateUrl: './interactive-dialog.component.html',
  styleUrls: ['./interactive-dialog.component.scss']
})
export class InteractiveDialogComponent {
  errorFormat: string;
  firstComponents: IMessComponent[];

  constructor(
    public dialogRef: MatDialogRef<InteractiveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InteractiveDialogData,
    public elr: ElementRef,
    private appService: AppService
  ) {
    this.errorFormat =
      !this.data.message.body?.data ||
      typeof this.data.message.body?.data === 'string' ||
      !(<IMessBodyData>this.data.message.body?.data)?.components ||
      (<IMessBodyData>this.data.message.body?.data)?.components.length === 0
        ? 'Unrenderable message!'
        : null;

    if (!this.errorFormat) {
      this.firstComponents = (this.data.message.body?.data as IMessBodyData)?.components || [];
    }
  }

  onCloseDialog($event) {
    this.dialogRef.close($event);
  }

  onShowProfile(event: InfoShowMention) {
    this.appService.update({
      memberMenu: <InfoShowMention>{
        ...event,
        convo: this.data?.channel
      }
    });
  }

  onMenuClosed() {
    const menu = this.elr.nativeElement.querySelector('.trigger-mention-menu') as HTMLElement;
    if (menu) {
      menu.style.display = 'none';
    }
  }
}
