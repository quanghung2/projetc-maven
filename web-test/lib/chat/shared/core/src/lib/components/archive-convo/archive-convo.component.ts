import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  ChannelQuery,
  ChannelService,
  ChatChannelStoreName,
  ConversationGroupService,
  GroupType,
  HistoryMessageService,
  MeQuery,
  Privacy,
  TimeService
} from '@b3networks/api/workspace';
import { EntityStoreAction, runEntityStoreAction } from '@datorama/akita';
import { finalize } from 'rxjs/operators';
import { SupportedConvo } from '../../core/adapter/convo-helper.service';
import { TxnService } from '../../core/service/txn/txn.service';

@Component({
  selector: 'csh-archive-convo',
  templateUrl: './archive-convo.component.html',
  styleUrls: ['./archive-convo.component.scss']
})
export class ArchiveConvoComponent implements OnInit {
  readonly GroupType = GroupType;
  readonly Privacy = Privacy;

  processing: boolean;

  constructor(
    private router: Router,
    private meQuery: MeQuery,
    private messageService: HistoryMessageService,
    private convoGroupService: ConversationGroupService,
    private channelService: ChannelService,
    private channelQuery: ChannelQuery,
    private txnService: TxnService,
    private timeService: TimeService,
    @Inject(MAT_DIALOG_DATA) public convo: SupportedConvo,
    private dialogRef: MatDialogRef<ArchiveConvoComponent>
  ) {}

  ngOnInit() {}

  submit() {
    const me = this.meQuery.getMe();
    if (this.convo.type === GroupType.WhatsApp || this.convo.type === GroupType.SMS) {
      this.txnService.archive(this.convo.id).subscribe(_ => {
        // clear message, because websocket not send msg
        this.messageService.cleanupConvoMessages([this.convo.id]);
        this.convoGroupService.resetChannelViewStateHistory(this.convo.id);

        this.processing = false;
        this.dialogRef.close();
        const general = this.channelQuery.getGeneral();
        if (general && general.length > 0) {
          this.router.navigate(['conversations', general[0].id, { type: general[0].type }]);
        }
      });
    } else {
      this.processing = true;

      this.channelService
        .archivedOrUnarchiveChannel(this.convo.id, true)
        .pipe(finalize(() => (this.processing = false)))
        .subscribe(_ => {
          // clear message, because websocket not send msg
          this.messageService.cleanupConvoMessages([this.convo.id]);
          this.channelService.resetChannelViewStateHistory(this.convo.id);

          this.processing = false;

          runEntityStoreAction(ChatChannelStoreName, EntityStoreAction.UpdateEntities, update =>
            update(this.convo.id, { archivedAt: new Date(this.timeService.nowInMillis()), archivedBy: me.userUuid })
          );
          this.dialogRef.close();

          const convos = this.channelQuery.getGeneral();
          this.router.navigate(['conversations', convos[0].id], {
            queryParamsHandling: 'merge'
          });
        });
    }
  }
}
