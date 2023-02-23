import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Channel,
  ChannelHyperspace,
  ChannelHyperspaceService,
  ChannelService,
  MeQuery,
  Privacy,
  RequestNamespacesHyper,
  ReqUpdateUsersChannelHyper,
  UpdateChannelReq,
  User,
  UserHyperspace
} from '@b3networks/api/workspace';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { UNKNOWN_USER } from '../../core/constant/common.const';
import { SupportedConvo } from './../../core/adapter/convo-helper.service';

@Component({
  selector: 'csh-remove-member',
  templateUrl: './remove-member.component.html',
  styleUrls: ['./remove-member.component.scss']
})
export class RemoveMemberComponent implements OnInit {
  readonly Privacy = Privacy;
  readonly UNKNOWN_USER = UNKNOWN_USER;

  ctaButton: string;
  processing: boolean;

  constructor(
    private meQuery: MeQuery,
    private channelService: ChannelService,
    private channelHyperspaceService: ChannelHyperspaceService,
    @Inject(MAT_DIALOG_DATA) public data: { convo: SupportedConvo; member: User | UserHyperspace },
    private dialogRef: MatDialogRef<RemoveMemberComponent>,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.ctaButton = `Yes, remove ${this.data.member?.displayName || 'member'}`;
  }

  submit() {
    const me = this.meQuery.getMe();
    if (me.identityUuid === this.data.member.identityUuid) {
      this.toastService.error("Couldn't remove yourself");
    } else if (this.data.convo instanceof Channel && this.data.convo.isGeneral) {
      this.toastService.error("Couldn't remove member in general channel");
    } else {
      if (this.data.convo instanceof ChannelHyperspace && this.data.convo.hyperspaceId) {
        const req: ReqUpdateUsersChannelHyper = {
          hyperspaceId: this.data.convo.hyperspaceId,
          hyperchannelId: this.data.convo.id,
          remove: [
            <RequestNamespacesHyper>{
              namespaceId: this.data.member.orgUuid,
              usersId: [this.data.member.userUuid]
            }
          ]
        };
        this.processing = true;
        this.channelHyperspaceService
          .updateUsersChannelHyper(req)
          .pipe(finalize(() => (this.processing = false)))
          .subscribe(_ => this.dialogRef.close());
      } else {
        if ((<Channel>this.data.convo).isGeneral) {
          this.toastService.error("Couldn't remove member in general channel");
        } else {
          const req = <UpdateChannelReq>{
            del: [this.data.member.userUuid]
          };
          this.processing = true;
          this.channelService
            .addOrRemoveParticipants(this.data.convo.id, req)
            .pipe(finalize(() => (this.processing = false)))
            .subscribe(_ => this.dialogRef.close());
        }
      }
    }
  }
}
