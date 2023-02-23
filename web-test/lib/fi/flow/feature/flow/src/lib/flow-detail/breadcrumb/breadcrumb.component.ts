import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Breadcrumb, Flow, FlowQuery, FlowService, PathOfBreadcrumb } from '@b3networks/api/flow';
import { Observable } from 'rxjs';

@Component({
  selector: 'b3n-breadcrumb-flow',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {
  flow$: Observable<Flow>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private flowQuery: FlowQuery,
    private flowService: FlowService
  ) {}

  ngOnInit(): void {
    this.flow$ = this.flowQuery.select();
  }

  getActivePath(b: Breadcrumb): PathOfBreadcrumb {
    return b.paths.find(p => p.isCurrent);
  }

  goToRoot(flow: Flow) {
    this.router.navigate([flow.uuid, flow.version], { relativeTo: this.activatedRoute.parent });
    this.flowService.resetTreeNodeSelected();
  }

  goToAction(flow: Flow, b: Breadcrumb, p: PathOfBreadcrumb) {
    if (p.nextActionUuid) {
      this.router.navigate([flow.uuid, flow.version], {
        relativeTo: this.activatedRoute.parent,
        queryParams: { actionUuid: p.nextActionUuid, pathId: p.pathId }
      });
    } else {
      this.router.navigate([flow.uuid, flow.version], {
        relativeTo: this.activatedRoute.parent,
        queryParams: { actionUuid: b.actionUuid, pathId: p.pathId }
      });
    }
    this.flowService.resetTreeNodeSelected();
  }
}
