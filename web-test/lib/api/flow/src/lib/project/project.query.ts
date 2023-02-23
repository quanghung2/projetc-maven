import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ProjectState, ProjectStore } from './project.store';

@Injectable({ providedIn: 'root' })
export class ProjectQuery extends QueryEntity<ProjectState> {
  projects$ = this.selectAll();

  constructor(protected override store: ProjectStore) {
    super(store);
  }
}
