import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SimpleFlow } from '../flow/flow.model';
import { CreateProjectReq, MemberOfProject, Project } from './project.model';
import { ProjectStore } from './project.store';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private http: HttpClient, private store: ProjectStore) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`flow/private/app/v1/projects`).pipe(tap(projects => this.store.set(projects)));
  }

  createProject(req: CreateProjectReq): Observable<Project> {
    return this.http.post<Project>(`flow/private/app/v1/projects`, req).pipe(tap(prj => this.store.add(prj)));
  }

  getProject(uuid: string): Observable<Project> {
    return this.http.get<Project>(`flow/private/app/v1/projects/${uuid}`);
  }

  updateProject(uuid: string, req: CreateProjectReq): Observable<Project> {
    return this.http
      .put<Project>(`flow/private/app/v1/projects/${uuid}`, req)
      .pipe(tap(prj => this.store.update(req.subUuid, prj)));
  }

  deleteProject(uuid: string): Observable<void> {
    return this.http.delete<void>(`flow/private/app/v1/projects/${uuid}`);
  }

  getFlowsOfProject(projectUuid: string, pageable: Pageable): Observable<Page<SimpleFlow>> {
    const params = new HttpParams().set('page', String(pageable.page)).set('size', String(pageable.perPage));

    return this.http
      .get<SimpleFlow[]>(`flow/private/simpleApp/v1/projects/${projectUuid}/flows`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(resp => {
          const page = new Page<SimpleFlow>();
          page.content = resp.body.map(flow => new SimpleFlow(flow));
          page.totalCount = +resp.headers.get(X_B3_HEADER.totalCount);
          return page;
        })
      );
  }

  assignMemberToProject(projectUuid: string, identityUuids: string[]) {
    return this.http.put(`flow/private/app/v1/projects/${projectUuid}/iam/assign`, { identityUuids });
  }

  removeMemberToProject(projectUuid: string, identityUuids: string[]) {
    return this.http.put(`flow/private/app/v1/projects/${projectUuid}/iam/remove`, { identityUuids });
  }

  updateMemberProject(uuid: string, assignedMembers: MemberOfProject[]) {
    this.store.update(uuid, { assignedMembers });
  }

  setActive(subUuid: string) {
    this.store.setActive(subUuid);
  }
}
