import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { DialogPosition, MatDialog } from '@angular/material/dialog';
import { MatSelectionListChange } from '@angular/material/list';
import { MatMenuTrigger } from '@angular/material/menu';
import { Router } from '@angular/router';
import { IAM_SERVICES, IAM_UI_ACTIONS, IAM_UI_RESOURCES, OrganizationPolicyQuery } from '@b3networks/api/auth';
import { RequestLeaveQuery } from '@b3networks/api/leave';
import {
  Channel,
  ChannelQuery,
  ChannelService,
  ChannelType,
  ChannelUI,
  CreateConvoGroupReq,
  FilterConvoMessageReq,
  HistoryMessageService,
  Integration,
  MeQuery,
  Privacy,
  User,
  UserStatus
} from '@b3networks/api/workspace';
import {
  ConferenceRoomComponent,
  ConvoHelperService,
  CreateConvoComponent,
  StoreContactComponent,
  UnifiedSearchChannel
} from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';

export enum TypeSearchDialog {
  teamInbox = 'teamInbox',
  inbox = 'inbox',
  channel = 'channel'
}

export enum TypeQuickSearch {
  USER = 'USER',
  INTEGRATION = 'INTEGRATION',
  CHANNEL = 'CHANNEL'
}

export enum SpecialKey {
  key1 = '@',
  key2 = '#'
}

export interface SearchInfo {
  score: number;
  type: TypeQuickSearch;
  uuid: string;

  channel?: UnifiedSearchChannel;
  integration?: Integration;
  user?: User;
}

const DEFAULT_CHANNEL_SIZE = 30;

@Component({
  selector: 'b3n-quick-search-channel',
  templateUrl: './quick-search-channel.component.html',
  styleUrls: ['./quick-search-channel.component.scss']
})
export class QuickSearchChannelComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('inputSearch') inputSearch: ElementRef;
  @ViewChild(MatMenuTrigger) matMenuTrigger: MatMenuTrigger;

  searchCtr: UntypedFormControl = this.fb.control('');
  valueSelectedCtr: UntypedFormControl = this.fb.control([]);
  filtered$: Observable<SearchInfo[]>;

  isFetchingApi: boolean;
  checkIamMeeting: boolean;
  currentSelect = 0;
  totalRow = 0;

  readonly TypeQuickSearch = TypeQuickSearch;
  readonly Privacy = Privacy;
  readonly UserStatus = UserStatus;
  readonly TypeSearchDialog = TypeSearchDialog;
  readonly ChannelType = ChannelType;

  constructor(
    private fb: UntypedFormBuilder,
    private dialog: MatDialog,
    private convoHelperService: ConvoHelperService,
    private router: Router,
    private channelQuery: ChannelQuery,
    private channelService: ChannelService,
    private organizationPolicyQuery: OrganizationPolicyQuery,
    private meQuery: MeQuery,
    private messageService: HistoryMessageService,
    private requestLeaveQuery: RequestLeaveQuery
  ) {
    super();
  }

  ngOnInit() {
    this.organizationPolicyQuery
      .selectGrantedIAM(X.orgUuid, IAM_SERVICES.ui, IAM_UI_ACTIONS.enableUWFeature)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(orgPolicy => {
        this.checkIamMeeting = orgPolicy?.hasResource(IAM_UI_RESOURCES.meetings) ? true : false;
      });

    this.filtered$ = this.searchCtr.valueChanges.pipe(
      takeUntil(this.destroySubscriber$),
      switchMap(text => {
        const value: string = text?.trim();
        if (!value) {
          const recent = this.convoHelperService.getRecentChannel()?.map(
            c =>
              <SearchInfo>{
                score: 1,
                type: TypeQuickSearch.CHANNEL,
                uuid: c.id,
                channel: c
              }
          );
          if (recent.length > 0) {
            return of(recent);
          }
          const dm = (this.convoHelperService.getDirectChannels(20) || [])?.map(
            c =>
              <SearchInfo>{
                score: 1,
                type: TypeQuickSearch.CHANNEL,
                uuid: c.id,
                channel: this.convoHelperService.transferUnifiedSearchChannel(c)
              }
          );
          return of(dm);
        }

        if (value?.startsWith(SpecialKey.key1)) {
          return of(
            this.convoHelperService
              .getAllUsersContainsAndMore(value?.substring(1), DEFAULT_CHANNEL_SIZE, {
                keys: ['displayName']
              })
              ?.result.map(
                search =>
                  <SearchInfo>{
                    score: search.score,
                    type: TypeQuickSearch.USER,
                    uuid: search.item.uuid,
                    user: new User({
                      ...search.item,
                      requestLeaveNow: this.requestLeaveQuery.getEntity(search?.item?.identityUuid)?.requestLeaveNow
                    })
                  }
              )
          );
        } else if (value?.startsWith(SpecialKey.key2)) {
          return of(
            this.convoHelperService
              .getChannelsContainsByQuickSearch(value?.substring(1), DEFAULT_CHANNEL_SIZE, {
                keys: ['displayName']
              })
              ?.result?.map(
                search =>
                  <SearchInfo>{
                    score: search.score,
                    type: TypeQuickSearch.CHANNEL,
                    uuid: search?.item?.id,
                    channel: search?.item
                  }
              )
          );
        } else {
          return of(this.searchAll(value));
        }
      }),
      catchError(() => of([])),
      tap(data => {
        this.totalRow = data.length;
        this.currentSelect = 0;
        setTimeout(() => {
          document.querySelector('.menu-quick-search-1 .current-select')?.scrollIntoView({
            block: 'nearest',
            inline: 'nearest'
          });
        });
      })
    );
  }

  trackByFiltered(_, item: SearchInfo) {
    return item?.uuid;
  }

  menuClosed() {
    this.searchCtr.setValue('');
    this.currentSelect = 0;
  }

  menuOpened() {
    this.searchCtr.setValue('');
    this.inputSearch?.nativeElement?.focus();
  }

  openCreateChannel() {
    this.dialog.open(CreateConvoComponent, {
      data: this.searchCtr.value || '',
      width: '700px',
      disableClose: true
    });
  }

  openCreateContact() {
    this.dialog.open(StoreContactComponent, { minWidth: '400px' });
  }

  openConferenceRoom() {
    this.dialog.open(ConferenceRoomComponent, {
      data: {},
      width: '450px',
      height: '100%',
      maxWidth: 'unset',
      position: <DialogPosition>{ right: '0px' },
      panelClass: 'search-message',
      autoFocus: false
    });
  }

  onChangeSelect($event) {
    this.currentSelect = $event;
    setTimeout(() => {
      document.querySelector('.menu-quick-search-1 .current-select')?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest'
      });
    });
  }

  onEnterSelect($event) {
    document.querySelector('.menu-quick-search-1 .current-select')?.dispatchEvent(new Event('click'));
  }

  onSelect($event: MatSelectionListChange) {
    if (!$event?.options?.length) {
      return;
    }

    const data = $event.options[0].value;
    if (data instanceof User) {
      this.createOrGetConvo(data);
    } else if (data instanceof Integration) {
      this.createOrGetConvo(data);
    } else {
      if (<UnifiedSearchChannel>data?.hyperspaceId) {
        this.router.navigate(['hyperspace', data.hyperspaceId, data.id]);
      } else {
        this.router.navigate(['conversations', data.id]);
      }
    }

    this.triggerCloseMenu();
    this.valueSelectedCtr.setValue([]);
  }

  private searchAll(value: string) {
    const channel = this.convoHelperService
      .getChannelsContainsByQuickSearch(value, DEFAULT_CHANNEL_SIZE, {
        keys: ['displayName']
      })
      ?.result?.map(
        search =>
          <SearchInfo>{
            score: search.score,
            type: TypeQuickSearch.CHANNEL,
            uuid: search?.item?.id,
            channel: search?.item
          }
      );

    const user = this.convoHelperService
      .getAllUsersContainsAndMore(value, DEFAULT_CHANNEL_SIZE, {
        keys: ['displayName']
      })
      ?.result.map(
        search =>
          <SearchInfo>{
            score: search.score,
            type: TypeQuickSearch.USER,
            uuid: search?.item?.uuid,
            user: new User({
              ...search.item,
              requestLeaveNow: this.requestLeaveQuery.getEntity(search?.item?.identityUuid)?.requestLeaveNow
            })
          }
      );

    const integration = this.convoHelperService
      .getIntegrationContains(value, 10, {
        keys: ['name']
      })
      ?.result?.map(
        search =>
          <SearchInfo>{
            score: search.score,
            type: TypeQuickSearch.INTEGRATION,
            uuid: search?.item?.uuid,
            integration: search?.item
          }
      );

    return [...user, ...integration, ...channel]?.sort((a, b) => a.score - b.score);
  }

  private triggerCloseMenu() {
    this.matMenuTrigger.closeMenu();
    this.searchCtr.setValue('');
  }

  private createOrGetConvo(user: User | Integration) {
    const convo =
      user instanceof User
        ? this.channelQuery.findChannelDirectChatWithMe(user.userUuid)
        : this.channelQuery.findChannelDirectChatWithMe(user.msChatUuid);

    if (convo) {
      // this.dialogRef.close();
      this.router.navigate(['conversations', convo.id], {
        queryParamsHandling: 'merge'
      });
    } else {
      const me = this.meQuery.getMe();
      this.channelService
        .createChannel(
          <CreateConvoGroupReq>{
            type: ChannelType.dm,
            participants: user instanceof User ? [me.userUuid, user.userUuid] : [me.userUuid, user.msChatUuid]
          },
          me.userUuid
        )
        .pipe(
          switchMap((newConvo: Channel) =>
            forkJoin([
              of(newConvo),
              // load history to avoid miss message, can add default message from server when creating convo
              this.messageService.getChannelHistory(newConvo.id, <FilterConvoMessageReq>{
                conversations: [newConvo.id],
                limit: 50
              })
            ])
          )
        )
        .subscribe(
          ([newConvo, _]) => {
            this.channelService.updateChannelViewState(newConvo.id, <ChannelUI>{
              loaded: true
            });

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
