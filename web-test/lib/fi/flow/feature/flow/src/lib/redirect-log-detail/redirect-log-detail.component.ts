import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ExecutionLogsService, FlowService, ViewDetailReq } from '@b3networks/api/flow';

@Component({
  selector: 'b3n-redirect-log-detail',
  templateUrl: './redirect-log-detail.component.html',
  styleUrls: ['./redirect-log-detail.component.scss']
})
export class RedirectLogDetailComponent implements OnInit {
  paramsReq: ViewDetailReq;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private flowService: FlowService,
    private executionlogsService: ExecutionLogsService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.paramsReq = <ViewDetailReq>{
        flowUuid: params['flowUuid'],
        id: params['id']
      };
      this.executionlogsService.getExecutionLogsRunningDetail(this.paramsReq).subscribe(log => {
        this.flowService.setViewLogVersion(log.version);
        this.router.navigate([this.paramsReq.flowUuid, log.version, 'logs', this.paramsReq.id], {
          relativeTo: this.route.parent
        });
      });
    });
  }
}
