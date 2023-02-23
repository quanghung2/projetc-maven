import { Component, Input, OnInit } from '@angular/core';
import { Agent, ComplianceService, ModalMessage, ModalService } from '../../shared';
import { ComplianceModalComponent } from '../compliance-modal.component';

@Component({
  selector: 'app-compliance-delete-user-modal',
  templateUrl: './compliance-delete-user-modal.component.html',
  styleUrls: ['./compliance-delete-user-modal.component.css'],
  host: {
    class: 'ui modal'
  }
})
export class ComplianceDeleteUserModalComponent implements OnInit {
  @Input() agent: Agent;
  public isLoading: boolean = false;

  constructor(private complianceService: ComplianceService, private modalService: ModalService) {}

  ngOnInit() {}

  onDelete() {
    this.isLoading = true;

    this.complianceService.deleteUser(this.agent).then(() => {
      this.openComplianceModal();
    });
  }

  openComplianceModal() {
    let message = new ModalMessage(ComplianceModalComponent, {});
    this.modalService.load(message);
    event.preventDefault();
  }
}
