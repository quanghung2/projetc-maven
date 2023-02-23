import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, ValidatorFn, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import {
  Channel,
  ChannelHyperspace,
  ChannelHyperspaceService,
  ChannelHyperspaceUI,
  ChannelService,
  ChannelType,
  CreateConvoGroupReq,
  FilterConvoMessageReq,
  HistoryMessageService,
  Hyperspace,
  HyperspaceQuery,
  MappingHyperData,
  MeQuery,
  Privacy,
  ReqCreateChannelHyper,
  RequestNamespacesHyper,
  RoleUserHyperspace,
  User,
  UserQuery,
  UserStatus
} from '@b3networks/api/workspace';
import { X } from '@b3networks/shared/common';
import { forkJoin, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';
import { ConvoHelperService } from '../../core/adapter/convo-helper.service';

const DEFAULT_SIZE = 50;

export class MyErrorStateMatcher1 implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
}

interface UserMapping {
  identityUuid: string;
  displayName: string;
  isCurrentOrg: boolean;
  shortName: string;
  userUuid: string;
}

@Component({
  selector: 'b3n-create-convo',
  templateUrl: './create-convo.component.html',
  styleUrls: ['./create-convo.component.scss']
})
export class CreateConvoComponent implements OnInit {
  readonly UserStatus = UserStatus;
  readonly MAX_LENGTH = 50;
  loading = false;
  isPublic = true;
  description = '';
  me: User;
  members: UserMapping[] = [];
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes = [ENTER, COMMA];
  memberCtrl = new UntypedFormControl();
  filteredMembers: Observable<UserMapping[]>;
  key = '';
  hyperspace$: Observable<Hyperspace[]>;
  hasHyperspace$: Observable<boolean>;
  selectHyper: string;
  disableTypeChannel: boolean;

  // nameControl: FormControl = this.fb.control('', Validators.compose([Validators.required,this.checkChannelExisted.bind(this)]);
  nameControl: UntypedFormControl = this.fb.control('', Validators.compose([Validators.required]));
  matcher = new MyErrorStateMatcher1();

  private listExistedChannels: string[] = [];
  private invalidChannels: string[] = [];

  @ViewChild('memberInput') memberInput: ElementRef;

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CreateConvoComponent>,
    private identityProfileQuery: IdentityProfileQuery,
    private meQuery: MeQuery,
    private userQuery: UserQuery,
    private messageService: HistoryMessageService,
    private channelService: ChannelService,
    private hyperspaceQuery: HyperspaceQuery,
    private convoHelperService: ConvoHelperService,
    private channelHyperspaceService: ChannelHyperspaceService
  ) {}

  ngOnInit() {
    if (this.data) {
      this.nameControl.setValue(this.data);
    }

    this.me = this.meQuery.getMe();
    this.hyperspace$ = this.hyperspaceQuery.selectHyperspaceByUser(this.me.identityUuid);
    this.hasHyperspace$ = this.hyperspaceQuery.selectHasHyperspacesByUser(this.me.identityUuid);
    this.updateFilteredMembers();
  }

  convertSpace() {
    setTimeout(() => {
      const text = this.nameControl.value?.trim();
      this.nameControl.setValue(`${text}-`);
    });
  }

  changeSelectHyperspace($event) {
    this.members = [];
    if ($event) {
      this.isPublic = true;
      this.disableTypeChannel = true;
    } else {
      this.disableTypeChannel = false;
    }
    this.updateFilteredMembers();
  }

  validatorChannel(existedChannels: string[], invalidChannels: string[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      return existedChannels.some(name => name === control?.value)
        ? { 'channel-existed': true }
        : invalidChannels.some(name => name === control?.value)
        ? { 'invalid-name': true }
        : null;
    };
  }

  updateFilteredMembers() {
    this.filteredMembers = this.memberCtrl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      startWith(this.memberCtrl.value),
      switchMap((name: string | null) => {
        if (!this.selectHyper) {
          return (
            typeof name === 'string' && name
              ? of(this.filter(name))
              : of(
                  this.userQuery
                    .getAllUsers()
                    .filter(
                      member =>
                        member.uuid !== this.me.identityUuid &&
                        !this.members.map(m => m.identityUuid).includes(member.identityUuid)
                    )
                    .slice(0, DEFAULT_SIZE)
                )
          ).pipe(
            map(users =>
              users.map(
                u =>
                  <UserMapping>{
                    identityUuid: u.identityUuid,
                    displayName: u.displayName,
                    isCurrentOrg: false,
                    shortName: null,
                    userUuid: u.userUuid
                  }
              )
            )
          );
        }

        this.key = typeof name === 'string' && name ? name : null;
        return typeof name === 'string' && name
          ? this.hyperspaceQuery.selectEntity(this.selectHyper).pipe(
              map(hyper =>
                hyper?.allMembers.filter(
                  member =>
                    member.displayName?.toUpperCase()?.trim()?.includes(name?.toUpperCase()?.trim()) &&
                    member.userUuid !== this.me.userUuid &&
                    !this.members.map(m => m.userUuid).includes(member.userUuid)
                )
              ),
              map(users =>
                users.map(
                  u =>
                    <UserMapping>{
                      identityUuid: u.identityUuid,
                      displayName: u.displayName,
                      isCurrentOrg: u.isCurrentOrg,
                      shortName: u.shortName,
                      userUuid: u.userUuid
                    }
                )
              )
            )
          : this.hyperspaceQuery.selectEntity(this.selectHyper).pipe(
              map(hyper =>
                hyper?.allMembers
                  .filter(
                    member =>
                      member.userUuid !== this.me.userUuid &&
                      !this.members.map(m => m.userUuid).includes(member.userUuid)
                  )
                  .slice(0, DEFAULT_SIZE)
              ),
              map(users =>
                users.map(
                  u =>
                    <UserMapping>{
                      identityUuid: u.identityUuid,
                      displayName: u.displayName,
                      isCurrentOrg: u.isCurrentOrg,
                      shortName: u.shortName,
                      userUuid: u.userUuid
                    }
                )
              )
            );
      })
    );
  }

  selected(event: MatAutocompleteSelectedEvent) {
    if (!this.members.some(x => x.userUuid === (<UserMapping>event.option.value)?.userUuid)) {
      this.members.push(event.option.value);
      this.updateFilteredMembers();
    }
    this.memberInput.nativeElement.value = '';
    this.memberCtrl.setValue(null);
    this.memberCtrl.disable();
    this.memberCtrl.enable();

    setTimeout(() => {
      this.memberInput.nativeElement.focus();
    }, 300);
  }

  filter(name: string) {
    this.key = name;
    return this.userQuery
      .getAllUsersContains(name, -1)
      .filter(
        member =>
          member.uuid !== this.me.identityUuid && !this.members.map(m => m.identityUuid).includes(member.identityUuid)
      );
  }

  create() {
    const me = this.meQuery.getMe();
    if (!this.selectHyper) {
      const name = this.nameControl.value;
      this.loading = true;
      this.channelService
        .createChannel(
          <CreateConvoGroupReq>{
            name: name,
            description: this.description,
            privacy: this.isPublic ? Privacy.public : Privacy.private,
            type: ChannelType.gc,
            participants: [me.userUuid].concat(this.members.map(x => x.userUuid))
          },
          me.userUuid
        )
        .pipe(
          finalize(() => (this.loading = false)),
          switchMap((newConvo: Channel) => {
            this.channelService.updateChannelViewState(newConvo.id, {
              needReceiveLiveMessage: true
            });
            const req = <FilterConvoMessageReq>{
              conversations: [newConvo.id],
              limit: 50
            };
            return forkJoin([
              of(newConvo),
              // load history to avoid miss message, can add default message from server when creating convo
              this.messageService.getChannelHistory(newConvo.id, req).pipe(
                tap(
                  () =>
                    this.channelService.updateChannelViewState(newConvo.id, {
                      loadedFirst: true
                    }),
                  () =>
                    this.channelService.updateChannelViewState(newConvo.id, {
                      loadedFirst: false,
                      needReceiveLiveMessage: false
                    })
                )
              )
            ]);
          })
        )
        .subscribe(
          ([newConvo, _]) => {
            this.dialogRef.close();

            this.router.navigate(['conversations', newConvo.id], {
              queryParamsHandling: 'merge'
            });
          },
          err => {
            if (err === 'already-exists') {
              this.listExistedChannels.push(name);
              this.nameControl.setValidators(
                Validators.compose([
                  Validators.required,
                  this.validatorChannel(this.listExistedChannels, this.invalidChannels)
                ])
              );
              this.nameControl.updateValueAndValidity();
            } else if (err === 'name is invalid') {
              this.invalidChannels.push(name);
              this.nameControl.setValidators(
                Validators.compose([
                  Validators.required,
                  this.validatorChannel(this.listExistedChannels, this.invalidChannels)
                ])
              );
              this.nameControl.updateValueAndValidity();
            } else {
              console.error('Error when ebstablish new groupchat');
            }
          }
        );
    } else {
      const hyper = this.hyperspaceQuery.getEntity(this.selectHyper);
      const name = this.nameControl.value;
      this.loading = true;
      const currentMember = <RequestNamespacesHyper>{
        id: X.orgUuid,
        users: this.members.filter(x => x.isCurrentOrg).map(u => ({ id: u.userUuid, role: RoleUserHyperspace.member }))
      };

      const otherMember = <RequestNamespacesHyper>{
        id: hyper.otherOrg.uuid,
        users: this.members.filter(x => !x.isCurrentOrg).map(u => ({ id: u.userUuid, role: RoleUserHyperspace.member }))
      };

      this.channelHyperspaceService
        .createChannel(
          <ReqCreateChannelHyper>{
            hyperspaceId: hyper.hyperspaceId,
            hyperchannel: {
              name: name,
              description: this.description,
              privacy: Privacy.public,
              type: ChannelType.gc,
              namespaces: [currentMember, otherMember]
            }
          },
          <MappingHyperData>{
            meUuid: me.userUuid,
            currentOrg: X.orgUuid
          }
        )
        .pipe(
          finalize(() => (this.loading = false)),
          switchMap((newConvo: ChannelHyperspace) => {
            const req = <FilterConvoMessageReq>{
              limit: 50,
              hyperchannelId: newConvo.id,
              hyperspaceId: newConvo.hyperspaceId
            };
            return forkJoin([
              of(newConvo),
              // load history to avoid miss message, can add default message from server when creating convo
              this.messageService.getChannelHyperHistory(newConvo.id, req)
            ]);
          })
        )
        .subscribe(
          ([newConvo, _]) => {
            this.dialogRef.close();

            this.channelHyperspaceService.updateChannelViewState(newConvo.id, <ChannelHyperspaceUI>{
              loaded: true
            });

            this.router.navigate(['hyperspace', hyper.hyperspaceId, newConvo.id], {
              queryParamsHandling: 'merge'
            });
          },
          err => {
            if (err === 'already-exists') {
              this.listExistedChannels.push(name);
              this.nameControl.setValidators(
                Validators.compose([
                  Validators.required,
                  this.validatorChannel(this.listExistedChannels, this.invalidChannels)
                ])
              );
              this.nameControl.updateValueAndValidity();
            } else if (err === 'name is invalid') {
              this.invalidChannels.push(name);
              this.nameControl.setValidators(
                Validators.compose([
                  Validators.required,
                  this.validatorChannel(this.listExistedChannels, this.invalidChannels)
                ])
              );
              this.nameControl.updateValueAndValidity();
            } else {
              console.error('Error when ebstablish new groupchat');
            }
          }
        );
    }
  }

  sortBy(members: UserMapping[]) {
    return members.sort((a, b) => a?.displayName?.localeCompare(b?.displayName));
  }

  trackBy(_, member: UserMapping) {
    return member != null ? member.identityUuid : null;
  }

  remove(member: UserMapping) {
    const index = this.members.findIndex(x => x.identityUuid === member.identityUuid);

    if (index >= 0) {
      this.members.splice(index, 1);
    }
  }

  onPaste(event: ClipboardEvent) {
    if (this.nameControl.value < this.MAX_LENGTH) {
      const clipboardData = event.clipboardData || (<any>window).clipboardData || window['clipboardData'];
      const pastedText = clipboardData.getData('text');

      let name = this.nameControl.value;
      name += pastedText.replace(/[^a-zA-Z0-9_]/g, '');
      name = name.substring(0, this.MAX_LENGTH);
    }
  }
}
