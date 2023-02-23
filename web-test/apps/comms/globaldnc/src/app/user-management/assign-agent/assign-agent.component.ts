import { ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, map, switchMap, tap } from 'rxjs/operators';
import { EventStreamService, MemberInfoModel } from '../../shared';
import { UserManagementService } from '../user-management.service';

declare let jQuery: any;
declare let X: any;

@Component({
  selector: 'assign-agent',
  templateUrl: './assign-agent.component.html',
  styleUrls: ['./assign-agent.component.scss']
})
export class AssignAgentComponent implements OnDestroy {
  @ViewChild('dropdownMmeber') dropdownMmeber: ElementRef;
  loading = true;
  assigning = false;
  role = 'AGENT';
  email = '';

  subscription: Array<Subscription> = new Array<Subscription>();

  // dropdown assign
  searchTerms$ = new Subject<string>();
  isSearching: boolean;
  selectedMember: string;
  listDefault: any[];
  textInput = '';
  dropdownMmeber$: any;

  constructor(
    private eventStreamService: EventStreamService,
    private userManagementService: UserManagementService,
    private cdr: ChangeDetectorRef
  ) {
    this.subscription.push(
      this.eventStreamService.on('show-assign-agent').subscribe(res => {
        this.role = res.role;
        this.eventStreamService.trigger('open-modal', 'assign-agent-modal');
        this.loading = false;
        this.cdr.detectChanges();
        this.configDropdownFetchData();
      })
    );

    this.subscribeChangeText();
  }

  ngOnDestroy() {
    for (const sub of this.subscription) {
      sub.unsubscribe();
    }
    if (this.searchTerms$) {
      this.searchTerms$.unsubscribe();
    }
  }

  configDropdownFetchData() {
    if (this.dropdownMmeber) {
      this.dropdownMmeber$ = jQuery(this.dropdownMmeber.nativeElement);
      // initial dropdown
      this.dropdownMmeber$.dropdown({
        useLabels: false,
        clearable: true
      });

      // search
      this.searchTerms$.next(undefined);
    }
  }

  subscribeChangeText() {
    this.isSearching = true;
    this.searchTerms$
      .pipe(
        finalize(() => (this.isSearching = false)),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term: string) => {
          this.isSearching = true;
          if ((this.listDefault && !term) || term === '') {
            return of(this.listDefault);
          }
          return this.userManagementService
            .getFreeMembersByKeyworkIgnoreAgent(term ? term.trim() : undefined, '100')
            .pipe(
              finalize(() => (this.isSearching = false)),
              map((members: MemberInfoModel[]) =>
                members.map(x => {
                  return { name: x.displayName, text: x.displayName, value: x.uuid };
                })
              ),
              tap(members => {
                if (!term || term === '') {
                  this.listDefault = [];
                  this.listDefault = members;
                }
              })
            );
        })
      )
      .subscribe(
        data => {
          if (this.dropdownMmeber$) {
            this.isSearching = false;
            this.dropdownMmeber$.dropdown('setup menu', {
              values: data
            });
            this.dropdownMmeber$.dropdown('show');
          }
        },
        err => (this.isSearching = false),
        () => (this.isSearching = false)
      );
  }

  onShowDropDown() {
    if (this.dropdownMmeber$) {
      if (!this.textInput || this.textInput === '') {
        this.dropdownMmeber$.dropdown('setup menu', {
          values: this.listDefault || []
        });
      }
      this.dropdownMmeber$.dropdown('show');
    }
  }

  onSelected($event) {
    this.textInput = '';
    this.selectedMember = $event;
  }

  research(text: string) {
    this.searchTerms$.next(text);
  }

  restore() {
    if (this.dropdownMmeber$) {
      this.textInput = '';
      this.listDefault = undefined;
      this.selectedMember = undefined;
      this.dropdownMmeber$.dropdown('restore defaults');
    }
  }

  assign(e) {
    this.assigning = true;
    let obs: Observable<any>;
    if (this.role == 'AGENT') {
      obs = this.userManagementService.assignAgent(null, this.email, 'agentLicence');
    } else if (this.role == 'DPO') {
      obs = this.userManagementService.assignAgent(this.selectedMember, null, 'dpoLicence');
    } else if (this.role == 'MANAGER') {
      obs = this.userManagementService.assignAgent(this.selectedMember, null, 'managerLicence');
    } else {
      obs = this.userManagementService.assignAgent(this.selectedMember, null, 'staffLicence');
    }
    obs
      .pipe(
        finalize(() => {
          this.assigning = false;
          this.restore();
        })
      )
      .subscribe(
        res => {
          this.eventStreamService.trigger('user-management:reload');
          this.eventStreamService.trigger('close-modal', 'assign-agent-modal');
        },
        res => {
          if (res['code'] == 'auth.CredentialInvalid') {
            X.showWarn(`Cannot find the email to assign`);
          } else {
            X.showWarn(res.message);
          }
          this.eventStreamService.trigger('close-modal', 'assign-agent-modal');
        }
      );
    e.stopPropagation();
  }
}
