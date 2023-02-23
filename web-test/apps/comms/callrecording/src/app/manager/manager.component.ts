import { Component, ElementRef, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from '../app-modal/modal.component';
import { Agent, AgentRole, ComplianceService, ModalMessage, ModalService, User, UserService } from '../shared';
import { ManagerAddMemberModalComponent } from './manager-add-member-modal/manager-add-member-modal.component';
import { ManagerSettingsModalComponent } from './manager-settings-modal/manager-settings-modal.component';
import { ManagerUpdateMemberModalComponent } from './manager-update-member-modal/manager-update-member-modal.component';

declare let jQuery: any;

@Component({
  selector: 'app-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.css']
})
export class ManagerComponent implements OnInit {
  @ViewChild('managementElement', { static: true }) managementElement: ElementRef;
  public currentUser: User;
  public action: EventEmitter<Object> = new EventEmitter();
  public users: Array<Agent>;
  public currentManager: Agent;
  public agentRole = AgentRole;

  public page = 1;
  private perPage = 50;

  public canLoadMore = true;
  public isLoading = false;

  constructor(
    private complianceService: ComplianceService,
    private userService: UserService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    this.action.subscribe(action => {
      if (action['name'] == 'refresh') {
        this.fetchUsers();
      } else if (action['name'] == 'updated') {
        this.updateLocalUser(action['agent']);
      } else if (action['name'] == 'add') {
        this.users.push(action['agent']);
      }
      ModalComponent.on('close');
    });
    this.userService.getProfile().then((user: User) => {
      console.log(user);

      this.currentUser = user;
    });
  }

  ngAfterViewInit() {
    this.fetchUsers();
  }

  showDropdown() {
    setTimeout(() => {
      jQuery(this.managementElement.nativeElement).find('.ui.dropdown').dropdown();
    }, 100);
  }

  fetchUsers(page: number = this.page, reset: boolean = true) {
    this.page = page;

    this.isLoading = true;
    if (reset) {
      this.users = undefined;
    }
    this.complianceService
      .getUsers({
        page: this.page,
        perPage: this.perPage
      })
      .then((data: any) => {
        if (reset) {
          this.users = [];
        }
        if (data.entries.length < this.perPage) {
          this.canLoadMore = false;
        }

        data.entries.forEach(entry => this.users.push(entry));

        this.showDropdown();

        this.isLoading = false;
      });
  }

  filterUsers(role: AgentRole) {
    if (this.users == undefined) {
      return [];
    }

    const res = [];
    this.users.forEach((user: Agent) => {
      if (role == AgentRole.AGENT && this.currentManager != undefined && this.currentManager.uuid != user.managerUuid) {
        return;
      }
      if (user.role == role) {
        res.push(user);
      }
    });

    return res;
  }

  toggleCurrentManager(event, manager: Agent) {
    this.currentManager = undefined;

    if (jQuery(event.target).hasClass('content') || jQuery(event.target).hasClass('manager')) {
      const element = jQuery(event.currentTarget);
      const isSelected = element.hasClass('active');
      element.parent('.list.managers:first').find('.item.active').removeClass('active');

      if (!isSelected) {
        this.currentManager = manager;
        element.addClass('active');
      }
      this.showDropdown();
    }
  }

  openManagerAddMemberModal() {
    const message = new ModalMessage(ManagerAddMemberModalComponent, {});
    this.modalService.load(message);
    event.preventDefault();
  }

  openManagerSettingsModal() {
    const message = new ModalMessage(ManagerSettingsModalComponent, {});
    this.modalService.load(message);
    event.preventDefault();
  }

  openManagerUpdateMemberModal(agent: any) {
    const message = new ModalMessage(ManagerUpdateMemberModalComponent, {
      action: this.action,
      agent
    });
    this.modalService.load(message);
    event.preventDefault();
  }

  setRoleManager(user: Agent) {
    this.setRole(user, {
      role: AgentRole.MANAGER,
      managerUuid: undefined
    });
  }

  setRoleAgent(user: Agent) {
    this.setRole(user, {
      role: AgentRole.AGENT,
      managerUuid: this.currentManager.uuid
    });
  }

  setRoleMember(user: Agent) {
    this.setRole(user, {
      role: AgentRole.MEMBER,
      managerUuid: undefined
    });
  }

  setRole(user: Agent, update: any) {
    const u = JSON.parse(JSON.stringify(user));
    u.role = update.role;
    u.managerUuid = update.managerUuid;

    if (
      (u.role == AgentRole.MANAGER && u.email == undefined) ||
      (u.role == AgentRole.AGENT && u.phoneNumber == undefined)
    ) {
      this.openManagerUpdateMemberModal(u);
    } else {
      this.updateUser(u);
    }
  }

  updateUser(user: Agent) {
    return this.complianceService.setUser(user).then(() => {
      this.updateLocalUser(user);
    });
  }

  updateLocalUser(userUpdate: Agent) {
    for (const key in this.users) {
      const user = this.users[key];
      if (user.uuid != userUpdate.uuid) {
        continue;
      }

      if (userUpdate.role != undefined) {
        user.role = userUpdate.role;
      }
      if (userUpdate.familyName != undefined) {
        user.familyName = userUpdate.familyName;
      }
      if (userUpdate.givenName != undefined) {
        user.givenName = userUpdate.givenName;
      }
      if (userUpdate.phoneNumber != undefined) {
        user.phoneNumber = userUpdate.phoneNumber;
      }
      if (userUpdate.callerId != undefined) {
        user.callerId = userUpdate.callerId;
      }
      if (userUpdate.email != undefined) {
        user.email = userUpdate.email;
      }
      if (userUpdate.managerUuid != undefined) {
        user.managerUuid = userUpdate.managerUuid;
      }
    }
    this.showDropdown();
  }
}
