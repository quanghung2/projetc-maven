import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ChatTypeTxn } from '@b3networks/api/callcenter';
import { ConversationGroup, ConversationGroupQuery, GroupType } from '@b3networks/api/workspace';
import { Txn, UploadDialogComponent, UploadDialogInput, UploadDialogV2Component } from '@b3networks/chat/shared/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'b3n-txns-footer',
  templateUrl: './txns-footer.component.html',
  styleUrls: ['./txns-footer.component.scss']
})
export class TxnsFooterComponent implements OnChanges {
  @Input() txn: Txn;

  convo$: Observable<ConversationGroup>;

  private _convoid: string;

  readonly ChatTypeTxn = ChatTypeTxn;

  constructor(private convoGroupQuery: ConversationGroupQuery, private dialog: MatDialog) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['txn'] && this._convoid !== this.txn.txnUuid) {
      this.convo$ = this.convoGroupQuery.selectEntity(this.txn.txnUuid);
    }
  }

  uploadFile(models: File[], convo: ConversationGroup, index: number) {
    if (!convo || (convo && convo.type === GroupType.SMS)) {
      return;
    }

    const dialog = this.dialog.open(UploadDialogComponent, {
      width: '500px',
      disableClose: true,
      data: <UploadDialogInput>{
        file: models[index],
        ticket: convo,
        index: index + 1,
        max: models.length
      }
    });

    dialog.afterClosed().subscribe(
      _ => {
        // next
        index = index + 1;
        if (index < models.length) {
          this.uploadFile(models, convo, index);
        }
      },
      err => {
        // next
        index = index + 1;
        if (index < models.length) {
          this.uploadFile(models, convo, index);
        }
      }
    );
  }

  uploadFileV2(models: File[], convo: ConversationGroup, index: number) {
    if (!convo || (convo && convo.type === GroupType.SMS)) {
      return;
    }

    const dialog = this.dialog.open(UploadDialogV2Component, {
      width: '500px',
      disableClose: true,
      data: <UploadDialogInput>{
        file: models[index],
        ticket: convo,
        index: index + 1,
        max: models.length
      }
    });

    dialog.afterClosed().subscribe(
      _ => {
        // next
        index = index + 1;
        if (index < models.length) {
          this.uploadFileV2(models, convo, index);
        }
      },
      err => {
        // next
        index = index + 1;
        if (index < models.length) {
          this.uploadFileV2(models, convo, index);
        }
      }
    );
  }
}
