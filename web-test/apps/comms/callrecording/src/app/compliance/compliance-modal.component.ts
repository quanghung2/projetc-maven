import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Agent, AgentRole, ComplianceService, ModalMessage, ModalService, SubscriptionService } from '../shared';
import { ComplianceAddUserModalComponent } from './compliance-add-user-modal/compliance-add-user-modal.component';
import { ComplianceDeleteUserModalComponent } from './compliance-delete-user-modal/compliance-delete-user-modal.component';
import { ComplianceRemoveRoleModalComponent } from './compliance-remove-role-modal/compliance-remove-role-modal.component';
import { ComplianceSettingModalComponent } from './compliance-setting-modal/compliance-setting-modal.component';
import { ComplianceUpdateUserModalComponent } from './compliance-update-user-modal/compliance-update-user-modal.component';

declare var jQuery: any;

@Component({
  selector: 'app-compliance-modal',
  templateUrl: './compliance-modal.component.html',
  styleUrls: ['./compliance-modal.component.css'],
  host: {
    class: 'ui compliance big modal'
  }
})
export class ComplianceModalComponent implements OnInit {
  @Input() subscription: Object;
  @ViewChild('usersElement', { static: true }) usersElement: ElementRef;
  public agents: Array<Agent>;
  public users: any = {
    agents: [],
    managers: [],
    admins: []
  };

  public managerCurrent: Agent;
  public complianceLicenseSize: number = 0;

  public pageCurrent: number = 1;
  public pageSize: number = 500;
  public pagination: any;
  public searchQuery: string = '';

  public isLoading: boolean = false;
  public canLoadMore: boolean = true;

  constructor(
    private modalService: ModalService,
    private complianceService: ComplianceService,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit() {
    this.getUsers();
    this.getSubscriptionPlan();
  }

  refreshDropdown() {
    setTimeout(() => {
      jQuery(this.usersElement.nativeElement).find('.ui.dropdown').not('.active').dropdown();
    }, 200);
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
      this.isLoading = false;
      if (this.agents == undefined) {
        this.agents = [];
      }
      if (data.entries == undefined || data.entries.length < this.pageSize) {
        this.canLoadMore = false;
      }

      this.agents = this.agents.concat(data.entries);

      this.users = {
        agents: this.filterUsersRole(AgentRole.AGENT),
        managers: this.filterUsersRole(AgentRole.MANAGER),
        admins: this.filterUsersRole(AgentRole.ADMIN)
      };

      this.refreshDropdown();
    });
  }

  getSubscriptionPlan() {
    this.isLoading = true;
    this.subscriptionService.getSubscriptions().then((subs: any) => {
      console.log(subs);

      for (let i = 0; i < subs.length; i++) {
        let sub = subs[i];
        if (sub.plan == undefined) return;

        if (sub.plan.name.startsWith('cr_compliance')) {
          this.complianceLicenseSize = sub.plan.numOfConcurrentCall;
        }
      }
    });
  }

  onSelectUser(agent: Agent, event) {
    if (agent.role != AgentRole.MANAGER) return;

    let isSelected = jQuery(event.currentTarget).hasClass('selected');

    jQuery(this.usersElement.nativeElement).find('.item.user.selected').removeClass('selected');

    if (isSelected) {
      this.managerCurrent = undefined;
    } else {
      this.managerCurrent = agent;
      jQuery(event.currentTarget).addClass('selected');
    }

    this.users.agents = this.filterUsersRole(AgentRole.AGENT);
    this.refreshDropdown();
  }

  filterUsersRole(role: AgentRole) {
    let res = Agent.filterRole(this.agents, role);
    if (role == AgentRole.AGENT && this.managerCurrent != undefined) {
      res = res.filter(agent => this.managerCurrent.uuid == agent.managerUuid);
    }
    return res;
  }

  openRemoveRoleModal(event, agent) {
    let message = new ModalMessage(ComplianceRemoveRoleModalComponent, {
      agent
    });
    this.modalService.load(message);
    event.preventDefault();
  }

  openUpdateUserModal(event, agent: Agent = new Agent()) {
    let message = new ModalMessage(ComplianceUpdateUserModalComponent, {
      agent,
      manager: this.managerCurrent
    });
    this.modalService.load(message);
    event.preventDefault();
  }

  openAddUserModal(role: any, event) {
    let message = new ModalMessage(ComplianceAddUserModalComponent, {
      role,
      manager: this.managerCurrent
    });
    this.modalService.load(message);
    event.preventDefault();
  }

  openDeleteUserModal(event, agent) {
    let message = new ModalMessage(ComplianceDeleteUserModalComponent, {
      agent
    });
    this.modalService.load(message);
    event.preventDefault();
  }

  openSettingModal(event) {
    let message = new ModalMessage(ComplianceSettingModalComponent, {});
    this.modalService.load(message);
    event.preventDefault();
  }
}
