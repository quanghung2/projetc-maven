import { Component, Input, OnInit } from '@angular/core';
import { ModalComponent } from '../../app-modal/modal.component';
import { Agent, AgentRole, ComplianceService, ModalMessage, ModalService } from '../../shared';
import { ComplianceModalComponent } from '../compliance-modal.component';
import { ComplianceUpdateUserModalComponent } from '../compliance-update-user-modal/compliance-update-user-modal.component';

@Component({
  selector: 'app-compliance-add-user-modal',
  templateUrl: './compliance-add-user-modal.component.html',
  styleUrls: ['./compliance-add-user-modal.component.css'],
  host: {
    class: 'ui modal'
  }
})
export class ComplianceAddUserModalComponent implements OnInit {
  @Input() role: AgentRole;
  @Input() manager: Agent;

  public agents: Array<Agent> = [];
  public errors: Array<String> = new Array<String>();
  public isLoading: boolean = false;

  public pageCurrent: number = 1;
  public pageSize: number = 500;
  public pagination: any;
  public searchQuery: string = '';

  constructor(private complianceService: ComplianceService, private modalService: ModalService) {}

  ngOnInit() {
    this.getUsers();
  }

  getUsers(page: number = 1, search: string = this.searchQuery) {
    this.pageCurrent = page;
    this.searchQuery = search;

    let params: any = {
      page: this.pageCurrent,
      perPage: this.pageSize
    };

    if (search != undefined) {
      params.search = search.trim();
    }

    this.isLoading = true;
    this.complianceService.getUsers(params).then((data: any) => {
      this.agents = this.agents.concat(Agent.filterRole(data.entries, AgentRole.MEMBER));

      this.isLoading = false;
      setTimeout(() => {
        ModalComponent.on('refresh');
      }, 300);
    });
  }

  onSelectAgent(agent: Agent, event) {
    agent.role = this.role;
    if (this.role == AgentRole.AGENT && this.manager != undefined) {
      agent.managerUuid = this.manager.uuid;
    }

    this.openUpdateUserModal(agent, event);
  }

  openComplianceModal() {
    let message = new ModalMessage(ComplianceModalComponent, {});
    this.modalService.load(message);
    event.preventDefault();
  }

  openUpdateUserModal(agent: Agent, event) {
    let message = new ModalMessage(ComplianceUpdateUserModalComponent, {
      agent
    });
    this.modalService.load(message);
    event.preventDefault();
  }

  addMember() {
    throw 'no implemented';
  }
}
