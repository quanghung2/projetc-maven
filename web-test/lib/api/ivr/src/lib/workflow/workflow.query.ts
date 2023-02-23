import { Injectable } from '@angular/core';
import { Order, QueryConfig, QueryEntity } from '@datorama/akita';
import { Workflow } from './workflow';
import { WorkflowState, WorkflowStore } from './workflow.store';

@QueryConfig({
  sortBy: 'label',
  sortByOrder: Order.ASC
})
@Injectable({ providedIn: 'root' })
export class WorkflowQuery extends QueryEntity<WorkflowState, Workflow> {
  workflows$ = this.selectAll();

  constructor(protected override store: WorkflowStore) {
    super(store);
  }

  searchWorkflows(q: string) {
    return this.selectAll({
      filterBy: e => (q ? e.displayText?.toLocaleLowerCase().includes(q.toLocaleLowerCase()) : true)
    });
  }
}
