import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Team, TeamQuery, TeamService } from '@b3networks/api/auth';
import { QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { Inbox, InboxesService, RoutingMode, StoreInboxRequest } from '@b3networks/api/inbox';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, map, Observable, startWith } from 'rxjs';

export interface StoreInboxData {
  isCreate: boolean;
  inbox: Inbox;
}

@Component({
  selector: 'b3n-store-inbox',
  templateUrl: './store-inbox.component.html',
  styleUrls: ['./store-inbox.component.scss']
})
export class StoreInboxComponent implements OnInit {
  @ViewChild('teamInput') teamInput: ElementRef<HTMLInputElement>;

  loading = true;
  isProcessing: boolean;
  group = this.fb.group({
    name: ['', [Validators.required]],
    queueUuid: [''],
    teams: [[]]
  });
  queues: QueueInfo[] = [];

  filteredTeams$: Observable<Team[]>;
  teamCtrl = new FormControl();
  separatorKeysCodes: number[] = [ENTER, COMMA];

  get name() {
    return this.group.get('name');
  }

  get teams() {
    return this.group.get('teams');
  }

  get queueUuid() {
    return this.group.get('queueUuid');
  }

  constructor(
    public dialogRef: MatDialogRef<StoreInboxComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreInboxData,
    private fb: UntypedFormBuilder,
    private queueService: QueueService,
    private teamService: TeamService,
    private teamQuery: TeamQuery,
    private inboxesService: InboxesService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.queueService.loadQueueList().subscribe(queues => {
      this.queues = queues;
    });

    this.filteredTeams$ = this.teamCtrl.valueChanges.pipe(
      startWith(null),
      map((text: string | Team) => {
        if (typeof text === 'string') {
          if (!text?.trim()) {
            return this.teamQuery.getAll();
          }

          return this.teamQuery.search(text?.trim());
        }
        return this.teamQuery.getAll();
      }),
      map(teams => teams?.filter(x => !this.teams.value?.some(s => s.uuid === x.uuid)))
    );
    this.teamService.getTeams(X.orgUuid, { forceLoad: true }).subscribe();

    if (!this.data.isCreate) {
      this.loading = true;
      this.inboxesService
        .getDetail(this.data.inbox?.uuid)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(inbox => {
          const teams = this.teamQuery.getAll();
          this.group.setValue({
            name: inbox?.name,
            queueUuid: inbox?.queueUuid,
            teams: teams?.filter(x => inbox?.teams.includes(x.uuid)) || []
          });
        });
    } else {
      this.loading = false;
    }
  }

  remove(team: Team): void {
    const index = this.teams.value?.findIndex(t => t.uuid === team.uuid);

    if (index >= 0) {
      const arr = [...this.teams.value];
      arr.splice(index, 1);
      this.teams.setValue(arr);
      this.teamCtrl.updateValueAndValidity();
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.teams.setValue([...this.teams.value, event.option.value as Team]);
    this.teamInput.nativeElement.value = '';
    this.teamCtrl.setValue(null);
  }

  onSave() {
    if (this.data.isCreate) {
      this.isProcessing = true;
      this.inboxesService
        .createInbox(<StoreInboxRequest>{
          name: this.name.value,
          routingMode: this.queueUuid.value ? RoutingMode.auto : RoutingMode.manual,
          queueUuid: this.queueUuid.value,
          teams: this.teams.value?.map(x => x?.uuid)
        })
        .pipe(finalize(() => (this.isProcessing = false)))
        .subscribe(
          _ => {
            this.dialogRef.close();
            this.toastService.success('Create Successfully!');
          },
          err => {
            this.toastService.error(err.message);
          }
        );
    } else {
      this.isProcessing = true;
      this.inboxesService
        .updateInbox(this.data.inbox.uuid, <StoreInboxRequest>{
          name: this.name.value,
          routingMode: this.queueUuid.value ? RoutingMode.auto : RoutingMode.manual,
          queueUuid: this.queueUuid.value,
          teams: this.teams.value?.map(x => x?.uuid)
        })
        .pipe(finalize(() => (this.isProcessing = false)))
        .subscribe(
          _ => {
            this.dialogRef.close();
            this.toastService.success('Update Successfully!');
          },
          err => {
            this.toastService.error(err.message);
          }
        );
    }
  }
}
