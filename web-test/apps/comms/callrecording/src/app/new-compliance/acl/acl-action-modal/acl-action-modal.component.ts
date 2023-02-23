import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import { BaseModalComponent } from '../../../shared/base-modal.component';
import { User } from '../../../shared/model';
import { Paginate } from '../../../shared/model/paginate';
import { NewComplianceService } from '../../../shared/service/new-compliance.service';
import { Stream, StreamId, StreamService } from '../../../shared/service/stream.service';
import { Pagination } from '../../../shared/util';
import { AclConfig, RuleConfig } from '../acl.component';

declare let X: any;
declare let $: any;

@Component({
  selector: 'app-acl-action-modal',
  templateUrl: './acl-action-modal.component.html',
  styleUrls: ['./acl-action-modal.component.css']
})
export class AclActionModalComponent extends BaseModalComponent implements OnInit {
  @ViewChild('dropdownInputMethod', { static: true }) dropdownInputMethod: ElementRef;

  public aclConfig: AclConfig;
  public unassignedMembers: User[];
  public action: string;

  public inputMethod: string;
  public showingMembers: User[];
  public paginate: Paginate;
  public saving: boolean;
  public callerIds: string[];
  public callerIdInput: string;
  public unassignedMembersFiltered: User[];

  public modalId: string = '#acl-action-modal';

  constructor(private streamService: StreamService, private complianceService: NewComplianceService) {
    super();
  }

  reset() {
    this.aclConfig = new AclConfig();
    this.unassignedMembers = [];
    this.action = '';

    this.inputMethod = 'manual';
    this.showingMembers = [];
    this.paginate = new Paginate();
    this.callerIds = [];
  }

  ngOnInit() {
    this.subscriptions = [];

    const subscription = this.streamService
      .getStream()
      .pipe(filter(stream => stream.id == StreamId.SHOW_ACL_ACTION_MODAL))
      .subscribe((stream: Stream) => {
        this.reset();
        this.initUIComponents();
        this.aclConfig = stream.data.acl;
        this.unassignedMembers = stream.data.members;
        this.unassignedMembersFiltered = [...this.unassignedMembers];
        this.action = stream.data.action;

        if (this.action == 'edit') {
          this.unassignedMembers[0].selected = true;
          this.callerIds = this.unassignedMembers[0].callerIds;
          this.callerIdInput = this.callerIds.join(',');
        } else {
          this.callerIdInput = '';
        }
        this.showMembers();
        this.showModal(this.modalId);
      });

    this.subscriptions.push(subscription);
  }

  initUIComponents() {
    try {
      setTimeout(() => {
        $(this.dropdownInputMethod.nativeElement)
          .find('.ui.dropdown')
          .dropdown({
            onChange: value => {
              this.inputMethod = value;
            }
          })
          .dropdown('set text', 'Manual input');
      }, 100);
    } catch (e) {
      console.error(e);
    }
  }

  showMembers(currentPage: number = 1) {
    this.paginate.currentPage = currentPage;
    this.paginate.maxPage =
      Math.floor(this.unassignedMembersFiltered.length / this.paginate.pageSize) +
      (this.unassignedMembersFiltered.length % this.paginate.pageSize > 0 ? 1 : 0);

    let minIndex: number = (this.paginate.currentPage - 1) * this.paginate.pageSize;
    let maxIndex: number = minIndex + this.paginate.pageSize - 1;

    this.showingMembers = _.filter(this.unassignedMembersFiltered, (item: User) => {
      return (
        this.unassignedMembersFiltered.indexOf(item) >= minIndex &&
        this.unassignedMembersFiltered.indexOf(item) <= maxIndex
      );
    });
  }

  getPageList(currentPage: number = 1) {
    return Pagination.getPageList(currentPage, this.paginate.maxPage);
  }

  save() {
    if (this.aclConfig && this.aclConfig.localPath) {
      if (this.inputMethod == 'manual') {
        this.callerIds = this.callerIdInput.replace(' ', '').split(',');
      }

      this.callerIds = _.filter(this.callerIds, (item: string) => {
        return item.length > 0;
      });

      if (this.callerIds.length == 0) {
        X.showWarn('You have not entered any callerIDs');
        return;
      }

      let newRuleItems: RuleConfig[] = _.map(
        _.filter(this.unassignedMembers, (item: User) => {
          return item.selected;
        }),
        (item: User) => {
          return new RuleConfig(item.uuid, this.callerIds);
        }
      );

      if (newRuleItems.length == 0) {
        X.showWarn('You have not selected any members');
        return;
      }

      this.aclConfig.configs = _.filter(this.aclConfig.configs, (item: RuleConfig) => {
        return !_.find(newRuleItems, (childItem: RuleConfig) => {
          return childItem.identityUuid == item.identityUuid;
        });
      });

      this.aclConfig.configs.push.apply(this.aclConfig.configs, newRuleItems);

      this.saving = true;
      this.complianceService
        .saveAclSetting(this.aclConfig)
        .then(data => {
          this.aclConfig = Object.assign(new AclConfig(), data);
          this.saving = false;
          X.showSuccess('Saved changes.');

          this.streamService.next(new Stream(StreamId.UPDATE_ACL_CONFIG, this.aclConfig));

          this.hideModal(this.modalId);
        })
        .catch((err: any) => {
          this.saving = false;
          console.error(err);
          X.showWarn('Error when saving. Please try again later.');
        });
    }
  }

  convertFile(event) {
    const reader = new FileReader();
    reader.onload = () => {
      let text = reader.result.toString();
      this.callerIds = text.replace(/[",;]/g, '').split(/[\n]/g);
    };

    reader.readAsText(event.target.files[0]);
  }

  searchMember(key) {
    this.unassignedMembersFiltered = _.filter(this.unassignedMembers, (item: User) => {
      return item.displayName.toUpperCase().includes(key.toUpperCase());
    });
    this.showMembers();
  }
}
