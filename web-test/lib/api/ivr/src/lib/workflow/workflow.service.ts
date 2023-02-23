import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RuleType } from '@b3networks/api/ivr';
import { ID } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Workflow, WorkflowVersion } from './workflow';
import { WorkflowStore } from './workflow.store';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  constructor(private http: HttpClient, private store: WorkflowStore) {}

  findWorkflows(): Observable<Workflow[]> {
    return this.http.get<Workflow[]>(`workflow/private/v1/workflow/ivr/workflows`).pipe(
      map(res => res.map(wo => new Workflow(wo))),
      tap(r => {
        if (this.store.idKey.length > 0) {
          this.store.add(r);
        } else {
          this.store.set(r);
        }
      })
    );
  }

  getWorkflow(uuid: string): Observable<Workflow> {
    return this.http.get<Workflow>(`workflow/private/v1/workflow/ivr/workflows/${uuid}`).pipe(
      map(wo => new Workflow(wo)),
      tap(r => this.store.add(r))
    );
  }

  createWorkflow(workflow: Workflow): Observable<Workflow> {
    return this.http.post<Workflow>(`workflow/private/v1/workflow/ivr/workflows`, workflow).pipe(
      map(res => new Workflow(res)),
      tap(r => this.store.add(r))
    );
  }

  updateWorkflow(uuid: string, workflow: Workflow): Observable<Workflow> {
    return this.http.put<Workflow>(`workflow/private/v1/workflow/ivr/workflows/${uuid}`, workflow).pipe(
      map(res => new Workflow(res)),
      tap(r => this.store.update(uuid, r))
    );
  }

  setActive(uuid: string) {
    this.store.setActive(uuid);
  }

  removeActive(arg0: ID) {
    this.store.removeActive(arg0);
  }

  deleteWorkflow(uuid: string) {
    return this.http
      .delete(`workflow/private/v1/workflow/ivr/workflows/${uuid}`)
      .pipe(tap(r => this.store.remove(uuid)));
  }

  searchNumber(number: string): Observable<Workflow[]> {
    const params = {
      phoneNumber: number
    };
    return this.http.get<Workflow[]>(`workflow/private/v1/workflow/ivr/workflows`, { params: params });
  }

  getVersion(workflowUuid: string, version?: number): Observable<any> {
    if (version) {
      return this.http
        .get<WorkflowVersion>(`workflow/private/v1/workflow/ivr/workflows/${workflowUuid}/versions/${version}`)
        .pipe(map(res => new WorkflowVersion(res)));
    }

    return this.http
      .get<WorkflowVersion[]>(`workflow/private/v1/workflow/ivr/workflows/${workflowUuid}/versions`)
      .pipe(map(list => list.map(i => new WorkflowVersion(i))));
  }

  createDraftVersion(workflowUuid: string): Observable<WorkflowVersion> {
    const body = {};
    return this.http
      .post<WorkflowVersion>(`workflow/private/v1/workflow/ivr/workflows/${workflowUuid}/versions/draft`, body)
      .pipe(map(res => new WorkflowVersion(res)));
  }

  getVersionByStatuses(workflowUuid: string, statuses: string[]): Observable<WorkflowVersion[]> {
    const status = statuses.toString();
    return this.http.get<WorkflowVersion[]>(
      `workflow/private/v1/workflow/ivr/workflows/${workflowUuid}/versions?statuses=${status}`
    );
  }

  requestGoLive(workflowUuid: string): Observable<WorkflowVersion> {
    const body = {};
    return this.http
      .post<WorkflowVersion>(
        `workflow/private/v1/workflow/ivr/workflows/${workflowUuid}/versions/request-go-live`,
        body
      )
      .pipe(map(res => new WorkflowVersion(res)));
  }

  rejectVersion(workflowUuid: string): Observable<WorkflowVersion> {
    const body = {};
    return this.http
      .post<WorkflowVersion>(`workflow/private/v1/workflow/ivr/workflows/${workflowUuid}/versions/reject`, body)
      .pipe(map(res => new WorkflowVersion(res)));
  }

  getAllPendingScheduleVersion(): Observable<WorkflowVersion[]> {
    return this.http.get<WorkflowVersion[]>(`workflow/private/v1/workflow/ivr/versions/need-to-approve`);
  }

  approveScheduleVersion(
    workflowVersion: WorkflowVersion,
    note: string,
    scheduleAt: number
  ): Observable<WorkflowVersion> {
    const body = {
      note: note,
      scheduleAt: scheduleAt
    };
    return this.http
      .post<WorkflowVersion>(
        `workflow/private/v1/workflow/ivr/workflows/${workflowVersion.workFlowUuid}/versions/approve`,
        body
      )
      .pipe(map(res => new WorkflowVersion(res)));
  }

  removeVersion(workflowUuid: string, version: number) {
    const body = {};
    return this.http
      .post(`workflow/private/v1/workflow/ivr/workflows/${workflowUuid}/versions/remove/${version}`, body)
      .pipe(map(res => new WorkflowVersion(res)));
  }

  rollbackVersion(workflowUuid: string, version: number): Observable<WorkflowVersion> {
    const body = {};
    return this.http
      .post<WorkflowVersion>(
        `workflow/private/v1/workflow/ivr/workflows/${workflowUuid}/versions/rollback/${version}`,
        body
      )
      .pipe(map(res => new WorkflowVersion(res)));
  }

  testCall(workflowUuid: string, officeHourType: RuleType, bodyRequest) {
    const body = {
      callerId: bodyRequest.callerId,
      dialingNumber: bodyRequest.dialingNumber,
      domain: bodyRequest.domain,
      orgUuid: bodyRequest.orgUuid
    };
    return this.http.post(`workflow/private/v1/call/trigger/${workflowUuid}/${officeHourType}`, body);
  }

  assignNumbers(workflowUuid: string, numbers): Observable<Workflow> {
    const body = {
      numbers: numbers
    };
    return this.http
      .post<Workflow>(`workflow/private/v1/workflow/ivr/workflows/${workflowUuid}/_assign`, body)
      .pipe(map(res => new Workflow(res)));
  }

  unassignNumbers(workflowUuid: string): Observable<Workflow> {
    const body = {};
    return this.http
      .post<Workflow>(`workflow/private/v1/workflow/ivr/workflows/${workflowUuid}/_unassign`, body)
      .pipe(map(res => new Workflow(res)));
  }
}
