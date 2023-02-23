import { Component, Input, OnInit } from '@angular/core';
import { Agent, AgentRole, ComplianceService, ModalMessage, ModalService } from '../../shared';
import { ComplianceModalComponent } from '../compliance-modal.component';

@Component({
  selector: 'app-compliance-remove-role-modal',
  templateUrl: './compliance-remove-role-modal.component.html',
  styleUrls: ['./compliance-remove-role-modal.component.css'],
  host: {
    class: 'ui modal'
  }
})
export class ComplianceRemoveRoleModalComponent implements OnInit {
  @Input() agent: Agent;
  public isLoading: boolean = false;

  constructor(private complianceService: ComplianceService, private modalService: ModalService) {}

  ngOnInit() {}

  onRemoveRole() {
    this.isLoading = true;

    this.agent.role = AgentRole.MEMBER;
    this.agent.managerUuid = undefined;

    this.complianceService.setUser(this.agent).then(() => {
      this.openComplianceModal();
    });
  }

  openComplianceModal() {
    let message = new ModalMessage(ComplianceModalComponent, {});
    this.modalService.load(message);
    event.preventDefault();
  }
}
