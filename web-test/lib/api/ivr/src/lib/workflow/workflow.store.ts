import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Workflow } from './workflow';

export interface WorkflowState extends EntityState<Workflow>, ActiveState {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workflow_workflows', idKey: 'uuid' })
export class WorkflowStore extends EntityStore<WorkflowState, Workflow> {
  constructor() {
    super();
  }
}
