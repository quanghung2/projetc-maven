import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Project } from '../project/project.model';

export function createInitialState(): ProjectState {
  return {} as ProjectState;
}

export interface ProjectState extends EntityState<Project>, ActiveState {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'project_store', idKey: 'subscriptionUuid' })
export class ProjectStore extends EntityStore<ProjectState> {
  constructor() {
    super(createInitialState());
  }
}
