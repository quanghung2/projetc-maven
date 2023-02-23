import { KeyValue } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { IAM_GROUP_UUIDS, IdentityProfileQuery, MeIamQuery } from '@b3networks/api/auth';
import { Workflow, WorkflowQuery, WorkflowService } from '@b3networks/api/ivr';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, mergeMap, startWith, takeUntil } from 'rxjs/operators';

export const PERMISSION_VALUE = 'Permission Management';
@Component({
  selector: 'b3n-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent extends DestroySubscriberComponent implements OnInit {
  links: KeyValue<string, string>[] = [
    { key: 'config', value: 'Configuration' },
    { key: 'blacklist', value: 'Blacklist' },
    { key: 'worktime', value: 'Work Time' }
  ];

  searchFlowCtrl: UntypedFormControl = this.fb.control('');
  selectedWorkflow: Workflow;
  filteredWorkflow$: Observable<Workflow[]>;

  get searchKey() {
    const key = this.searchFlowCtrl.value;
    return typeof key === 'string' ? key : key?.displayText;
  }

  @Output() childLinkChanged = new EventEmitter<string>();

  constructor(
    private fb: UntypedFormBuilder,
    private workflowQuery: WorkflowQuery,
    private workflowService: WorkflowService,
    private meIamQuery: MeIamQuery,
    private profileQuery: IdentityProfileQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.filteredWorkflow$ = this.searchFlowCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroySubscriber$),
      mergeMap((value: Workflow | string) => {
        console.log(value);
        if (value instanceof Workflow) {
          this.workflowService.setActive(value.uuid);
        } else if (value == null) {
          if (this.workflowQuery.getActiveId()) {
            this.workflowService.removeActive(this.workflowQuery.getActiveId());
          }
        }

        const q = typeof value === 'string' ? value : null;
        return this.workflowQuery.searchWorkflows(q);
      })
    );

    this.workflowQuery.selectActiveId().subscribe(id => {
      this.selectedWorkflow = this.workflowQuery.getActive();
      if (!!id && this.searchFlowCtrl.value !== id) {
        console.log(`activated changed ${id}`);
        this.searchFlowCtrl.setValue(this.workflowQuery.getActive());
      }
    });

    combineLatest([this.profileQuery.currentOrg$, this.meIamQuery.selectGrantedGroup(IAM_GROUP_UUIDS.autoAttendant)])
      .pipe(
        filter(([org]) => !!org),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(([org, hasPermissionGroup]) => {
        if (
          (org.isOwner || (org.isAdmin && hasPermissionGroup)) &&
          !this.links.some(link => link.key === 'permission')
        ) {
          this.links.push({ key: 'permission', value: PERMISSION_VALUE });
        }
      });
  }

  workflowDisplayFn(member: Workflow): string {
    return member ? member.displayText : '';
  }

  trackBy(i, w: Workflow) {
    return w && w.uuid;
  }
}
