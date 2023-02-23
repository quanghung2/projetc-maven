import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentListComponent } from './agent-list.component';
import { ActionBarComponent } from './action-bar/action-bar.component';
import { AssignQueuesComponent } from './assign-queues/assign-queues.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {Route, RouterModule} from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';

const routes: Route[] = [{ path: '', component: AgentListComponent }];

@NgModule({
    declarations: [AgentListComponent, ActionBarComponent, AssignQueuesComponent],
    exports: [
        ActionBarComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forChild(routes),
        SharedUiMaterialModule,
        SharedAuthModule,
        SharedCommonModule
    ]
})
export class AgentListModule {}
