import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { IdentityProfileQuery, ProfileOrg } from '@b3networks/api/auth';
import { ActionCompliance, DNCByPassReason, FlowInfo, UnifiedHistory } from '@b3networks/api/data';
import { Flow, FlowService, ProjectService } from '@b3networks/api/flow';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { forkJoin, Observable } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'poh-history-detail',
  templateUrl: './history-detail.component.html',
  styleUrls: ['./history-detail.component.scss']
})
export class HistoryDetailComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  readonly ActionCompliance = ActionCompliance;
  readonly DNCByPassReason: HashMap<string> = DNCByPassReason;

  @Input() history: UnifiedHistory;
  @Output() closeSidenav = new EventEmitter();

  org: ProfileOrg;

  constructor(
    private toastService: ToastService,
    private profileQuery: IdentityProfileQuery,
    private flowService: FlowService,
    private projectService: ProjectService
  ) {
    super();
  }

  ngOnInit(): void {
    this.profileQuery.currentOrg$
      .pipe(
        filter(org => !!org),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(org => {
        this.org = org;
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['history']) {
      if (this.history?.flows) {
        const linkApi: Observable<Flow>[] = [];
        this.history.flows.map(f => {
          if (f.version > 0) {
            linkApi.push(this.flowService.getFlowDetail({ flowUuid: f.flowUuid, version: f.version }, false));
          }
        });
        forkJoin(linkApi).subscribe(flows => {
          this.history.flows.map(f => {
            const curFlow = flows.find(x => x.uuid === f.flowUuid);
            if (curFlow) {
              f.flowName = curFlow.name;
            }
            if (f.projectUuid) {
              this.projectService.getProject(f.projectUuid).subscribe(prj => {
                f.projectName = prj.name;
              });
            }
          });
        });
      }
    }
  }

  close() {
    this.closeSidenav.emit();
  }

  copied(event: Event) {
    event.stopPropagation();
    this.toastService.success('Copied to clipboard!');
  }

  openAppFlow(flow: FlowInfo, event) {
    event.stopPropagation();
    if (this.org.licenseEnabled) {
      const url = `/${flow.projectUuid}/log/${flow.flowUuid}/${flow.version}/${flow.executionUuid}`;
      window.open(`${location.origin}/#/${X.orgUuid}/DeveloperHub?redirect=${url}`, '_blank');
    } else {
      let url;
      if (flow.version > 0) {
        url = `/flow/${flow.flowUuid}/${flow.version}/logs/${flow.executionUuid}`;
      } else {
        url = `/flow/${flow.flowUuid}/log/${flow.executionUuid}`;
      }
      window.open(`${location.origin}/#/${X.orgUuid}/Flow?redirect=${url}`, '_blank');
    }
  }
}
