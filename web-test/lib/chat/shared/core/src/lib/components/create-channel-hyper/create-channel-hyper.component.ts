import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, ValidatorFn, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  ChannelHyperspace,
  ChannelHyperspaceService,
  ChannelHyperspaceUI,
  ChannelService,
  ChannelType,
  FilterConvoMessageReq,
  HistoryMessageService,
  Hyperspace,
  HyperspaceQuery,
  HyperspaceService,
  MappingHyperData,
  MeQuery,
  Privacy,
  ReqCreateChannelHyper,
  User,
  UserQuery,
  UserStatus
} from '@b3networks/api/workspace';
import { X } from '@b3networks/shared/common';
import { forkJoin, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, map, startWith, switchMap } from 'rxjs/operators';
import { ConvoHelperService } from '../../core/adapter/convo-helper.service';

const DEFAULT_SIZE = 5;

export interface CreateChannelHyperInput {
  key: string;
  hyperspace: Hyperspace;
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
}

@Component({
  selector: 'b3n-create-channel-hyper',
  templateUrl: './create-channel-hyper.component.html',
  styleUrls: ['./create-channel-hyper.component.scss']
})
export class CreateChannelHyperComponent implements OnInit {
  readonly UserStatus = UserStatus;
  readonly MAX_LENGTH = 50;
  loading = false;
  isPublic = true;
  description = '';
  me: User;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes = [ENTER, COMMA];
  memberCtrl = new UntypedFormControl();
  key = '';

  users$: Observable<User[]>;
  usersSelected: User[] = [];

  nameControl: UntypedFormControl = this.fb.control('', Validators.compose([Validators.required]));
  matcher = new MyErrorStateMatcher();

  private listExistedChannels: string[] = [];
  private invalidChannels: string[] = [];

  @ViewChild('memberInput') memberInput: ElementRef;

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: CreateChannelHyperInput,
    private dialogRef: MatDialogRef<CreateChannelHyperComponent>,
    private meQuery: MeQuery,
    private userQuery: UserQuery,
    private messageService: HistoryMessageService,
    private channelService: ChannelService,
    private hyperspaceQuery: HyperspaceQuery,
    private hyperspaceService: HyperspaceService,
    private channelHyperspaceService: ChannelHyperspaceService,
    private convoHelperService: ConvoHelperService
  ) {}

  ngOnInit() {
    if (this.data.key) {
      this.nameControl.setValue(this.data.key);
    }

    this.me = this.meQuery.getMe();
    this.updateFilteredMembers();
  }

  convertSpace() {
    setTimeout(() => {
      const text = this.nameControl.value?.trim();
      this.nameControl.setValue(`${text}-`);
    });
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

  selected(event: MatAutocompleteSelectedEvent) {
    if (!this.usersSelected.includes(event.option.value)) {
      this.usersSelected.push(event.option.value);
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

  create() {
    const me = this.meQuery.getMe();
    const hyper = this.data.hyperspace;
    const name = this.nameControl.value;
    this.loading = true;
    this.channelHyperspaceService
      .createChannel(
        <ReqCreateChannelHyper>{
          hyperspaceId: hyper.hyperspaceId,
          hyperchannel: {
            name: name,
            description: this.description,
            privacy: Privacy.public,
            type: ChannelType.gc,
            namespaces: [
              // <RequestNamespacesHyper>{
              //   id: X.orgUuid,
              //   // users: this.usersSelected.map(u => ({ id: u.userUuid, role: RoleUserHyperspace.member }))
              //   users: [{ id: this.meQuery.getMe().userUuid, role: RoleUserHyperspace.admin }]
              // }
            ]
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
          if (err === 'already exists') {
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

  trackBy(member: User) {
    return member?.identityUuid;
  }

  remove(member: User) {
    const index = this.usersSelected.indexOf(member);

    if (index >= 0) {
      this.usersSelected.splice(index, 1);
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

  private updateFilteredMembers() {
    this.users$ = this.memberCtrl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      startWith(this.memberCtrl.value),
      switchMap((search: string | User) =>
        typeof search === 'string'
          ? this.hyperspaceQuery.searchUsersInsideHyperspace(this.data.hyperspace.id, search)
          : !!search
          ? this.hyperspaceQuery.selectEntity(this.data.hyperspace?.id, entity =>
              entity?.currentOrg?.users?.filter(u => u.userUuid !== search.userUuid)
            )
          : this.hyperspaceQuery.selectEntity(this.data.hyperspace?.id, entity => entity?.currentOrg?.users)
      ),
      map(users => {
        return [...users]
          ?.filter(u => !this.usersSelected.some(x => x.userUuid === u.userUuid))
          ?.sort((a, b) => a?.displayName?.localeCompare(b?.displayName));
      })
    );
  }
}
