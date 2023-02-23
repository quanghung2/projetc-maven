import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu } from '@angular/material/menu';
import { Router } from '@angular/router';
import { IdentityProfileService, Member, OrgMemberService } from '@b3networks/api/auth';
import { ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionQuery } from '@b3networks/api/callcenter';
import {
  Channel,
  ChannelHyperspace,
  ChannelHyperspaceService,
  ChannelQuery,
  ChannelService,
  ChannelType,
  CreateConvoGroupReq,
  GroupType as GroupTypeWorkspace,
  HyperspaceQuery,
  MeQuery,
  RequestNamespacesHyper,
  ReqUpdateUsersChannelHyper,
  RoleType,
  RoleUserHyperspace,
  UpdateChannelReq,
  User,
  UserHyperspace,
  UserQuery,
  UserService
} from '@b3networks/api/workspace';
import { X } from '@b3networks/shared/common';
import { OrgChartDialogComponent } from '@b3networks/shared/ui/portal';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable, of } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { RemoveMemberComponent } from '../remove-member/remove-member.component';
import { SupportedConvo } from './../../core/adapter/convo-helper.service';

@Component({
  selector: 'csh-render-member-menu',
  templateUrl: './render-member-menu.component.html',
  styleUrls: ['./render-member-menu.component.scss']
})
export class RenderMemberMenuComponent implements OnInit, OnChanges {
  readonly RoleType = RoleType;
  readonly GroupTypeWorkspace = GroupTypeWorkspace;

  @ViewChild('profileMenu', { static: true }) menu: MatMenu;

  @Input() member: User;
  @Input() convo: SupportedConvo; // optional to render action blocks

  me$: Observable<User>;
  userHyperspace$: Observable<UserHyperspace> = of(null);
  isGeneral: boolean;
  infoMember$: Observable<User>;
  selectExtension$: Observable<ExtensionBase>;

  constructor(
    private router: Router,
    private meQuery: MeQuery,
    private channelService: ChannelService,
    private channelQuery: ChannelQuery,
    private toastService: ToastService,
    public dialog: MatDialog,
    private channelHyperspaceService: ChannelHyperspaceService,
    private hyperspaceQuery: HyperspaceQuery,
    private userQuery: UserQuery,
    private identityProfileService: IdentityProfileService,
    private userService: UserService,
    private orgMemberService: OrgMemberService,
    private extensionQuery: ExtensionQuery
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['convo']) {
      this.isGeneral = (<Channel>this.convo)?.isGeneral;
    }
    if (changes['member']) {
      const isHyperChannel = !!(<ChannelHyperspace>this.convo)?.hyperspaceId;
      let tapOne = false;
      this.userHyperspace$ = isHyperChannel
        ? this.hyperspaceQuery.selectHyperByHyperspaceId((<ChannelHyperspace>this.convo)?.hyperspaceId).pipe(
            filter(x => x != null),
            map(hyper => hyper.allMembers?.find(x => x.userUuid === this.member.userUuid)),
            tap(member => {
              if (!tapOne && member?.isCurrentOrg) {
                tapOne = true;
                this.infoMember$ = this.userQuery.selectUserByChatUuid(member.userUuid);
                this.fetchDetailUser(this.member);
                this.selectExtension$ = this.extensionQuery.selectExtensionByUser(member.identityUuid);
              }
            })
          )
        : of(null);

      this.selectExtension$ =
        this.member?.userUuid && !isHyperChannel
          ? this.extensionQuery.selectExtensionByUser(this.member.uuid)
          : of(null);
      this.infoMember$ =
        this.member?.userUuid && !isHyperChannel ? this.userQuery.selectUserByChatUuid(this.member.userUuid) : of(null);
      if (!isHyperChannel && this.member) {
        this.fetchDetailUser(this.member);
      }
    }
  }

  ngOnInit(): void {
    this.me$ = this.meQuery.me$.pipe(filter(x => x != null));
  }

  createOrGetConvo(user: User) {
    if ((<ChannelHyperspace>this.convo)?.hyperspaceId) {
      this.toastService.warning('Direct chat is coming soon!');
    } else {
      const dmChannel = this.channelQuery.findChannelDirectChatWithMe(user.userUuid);

      if (dmChannel) {
        this.router.navigate(['conversations', dmChannel.id], {
          queryParamsHandling: 'merge'
        });
      } else {
        this.createChanne(user);
      }
    }
  }

  invite() {
    const req = <UpdateChannelReq>{
      add: [this.member.userUuid]
    };
    this.channelService.addOrRemoveParticipants(this.convo.id, req).subscribe();
  }

  inviteChannelHyper() {
    const req = <ReqUpdateUsersChannelHyper>{
      hyperspaceId: (<ChannelHyperspace>this.convo).hyperspaceId,
      hyperchannelId: this.convo.id,
      add: [
        <RequestNamespacesHyper>{
          namespaceId: this.member.orgUuid,
          users: [
            {
              id: this.member.userUuid,
              role: RoleUserHyperspace.member
            }
          ]
        }
      ]
    };

    this.channelHyperspaceService.updateUsersChannelHyper(req).subscribe(
      res => {
        this.toastService.success('Invite member successfully!');
      },
      error => {
        this.toastService.error(error.message || 'Invite member failed!');
      }
    );
  }

  remove(user: User) {
    if (this.convo.type === ChannelType.dm || !this.convo.isMember) {
      this.toastService.error('You have no permission to do this');
    } else {
      this.dialog.open(RemoveMemberComponent, {
        width: '600px',
        data: { convo: this.convo, member: user }
      });
    }
  }

  removeChannelHyper(user: User) {
    if (this.convo.type === ChannelType.dm || !this.convo.isMember) {
      this.toastService.error('You have no permission to do this');
    } else {
      this.dialog.open(RemoveMemberComponent, {
        width: '600px',
        data: { convo: this.convo, member: user }
      });
    }
  }

  onOpenOrgChartDialog(identityUuid: string) {
    this.dialog.open(OrgChartDialogComponent, {
      data: { identityUuid },
      restoreFocus: false,
      disableClose: true
    });
  }

  private fetchDetailUser(user: User) {
    const { uuid, isTemporary } = user;
    const ui = this.userQuery.getUiState(user.uuid);

    !!user && isTemporary && this.userService.findByUuidAndUserType([user.userUuid], 'chatId').subscribe();

    !ui?.loadedTeams &&
      this.identityProfileService.getTeams(uuid).subscribe(teams => {
        this.userService.updateUsers2Store([<User>{ uuid, teams }]);
        this.userService.updateUserViewState(user.uuid, {
          loadedTeams: true
        });
      });

    !ui?.loadedDetailFromAuth &&
      this.orgMemberService.getMember(X.orgUuid, uuid).subscribe((member: Member) => {
        const { about } = member;
        this.userService.updateUsers2Store([<User>{ uuid, about }]);
        this.userService.updateUserViewState(user.uuid, {
          loadedDetailFromAuth: true
        });
      });
  }

  private createChanne(user: User) {
    const me = this.meQuery.getMe();
    if (me && user) {
      this.channelService
        .createChannel(
          <CreateConvoGroupReq>{
            type: ChannelType.dm,
            participants: [me.userUuid, user.userUuid]
          },
          me.userUuid
        )
        .subscribe(
          newConvo => {
            this.router.navigate(['conversations', newConvo.id], {
              queryParamsHandling: 'merge'
            });
          },
          _ => {
            console.error('Error when ebstablish new directchat');
          }
        );
    }
  }
}
