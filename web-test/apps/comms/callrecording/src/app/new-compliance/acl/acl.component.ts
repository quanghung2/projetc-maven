import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import { User } from '../../shared/model';
import { NewComplianceService } from '../../shared/service/new-compliance.service';
import { Stream, StreamId, StreamService } from '../../shared/service/stream.service';

declare let X: any;

@Component({
  selector: 'app-acl',
  templateUrl: './acl.component.html',
  styleUrls: ['./acl.component.css']
})
export class AclComponent implements OnInit {
  public aclConfig: AclConfig;
  public newItem: any;

  public addedMembers: User[];

  public editing: boolean;
  public loading: boolean;
  public saving: boolean;
  public showingMembers: User[];
  public query: string;

  constructor(private complianceService: NewComplianceService, private streamService: StreamService) {}

  ngOnInit() {
    this.aclConfig = new AclConfig();
    this.newItem = {
      query: '',
      callerIds: ''
    };
    this.addedMembers = [];
    this.editing = false;
    this.loading = true;
    this.saving = false;
    this.showingMembers = [];
    this.query = '';

    this.complianceService
      .getAclSetting()
      .then(data => {
        this.aclConfig = Object.assign(new AclConfig(), data);
        this.updatedUIData();
        this.loading = false;
      })
      .catch((err: any) => {
        this.loading = false;
        console.error(err);
        X.showWarn('Cannot get acl information. Please try again later.');
      });

    this.streamService
      .getStream()
      .pipe(filter(stream => stream.id == StreamId.UPDATE_ACL_CONFIG))
      .subscribe((stream: Stream) => {
        this.aclConfig = Object.assign(new AclConfig(), stream.data);
        this.updatedUIData();
      });
  }

  updatedUIData() {
    this.addedMembers = _.filter(this.complianceService.allMembers, (item: User) => {
      let existConfig: RuleConfig = _.find(this.aclConfig.configs, (config: RuleConfig) => {
        return config.identityUuid == item.uuid;
      });

      if (existConfig) {
        item.callerIds = existConfig.callerIds;
        item.isAllowAll = item.callerIds.length == 1 && item.callerIds[0] == '*';
        return true;
      }

      return false;
    });

    this.searchMembers();
  }

  deleteItem(identityUuid: string) {
    this.addedMembers = _.filter(this.addedMembers, (item: User) => {
      return item.uuid != identityUuid;
    });

    this.saveAcl();
  }

  public saveAcl() {
    if (this.aclConfig && this.aclConfig.localPath) {
      this.saving = true;

      this.aclConfig.configs = _.map(this.addedMembers, (member: User) => {
        return new RuleConfig(member.uuid, member.callerIds);
      });

      this.complianceService
        .saveAclSetting(this.aclConfig)
        .then(data => {
          this.aclConfig = Object.assign(new AclConfig(), data);
          this.updatedUIData();
          this.editing = false;
          this.saving = false;
          X.showSuccess('Saved changes.');
        })
        .catch((err: any) => {
          this.editing = false;
          this.saving = false;
          console.error(err);
          X.showWarn('Error when saving. Please try again later.');
        });
    }
  }

  openAddItemModal() {
    let addedIdentityUuids: string[] = _.map(this.addedMembers, (item: User) => {
      return item.uuid;
    });

    let unassignedMembers: User[] = _.filter(this.complianceService.allMembers, (item: User) => {
      return !addedIdentityUuids.includes(item.uuid);
    });

    this.streamService.next(
      new Stream(StreamId.SHOW_ACL_ACTION_MODAL, {
        members: unassignedMembers,
        action: 'add',
        acl: this.aclConfig
      })
    );
  }

  openEditItemModal(member: User) {
    this.streamService.next(
      new Stream(StreamId.SHOW_ACL_ACTION_MODAL, {
        members: [member],
        action: 'edit',
        acl: this.aclConfig
      })
    );
  }

  searchMembers() {
    this.showingMembers = _.filter(this.addedMembers, (item: User) => {
      return !this.query || item.callerIds.includes(this.query) || this.searchMembersByName(this.query, item);
    });

    if (this.showingMembers.length > 0) {
      this.query = '';
    }
  }

  searchMembersByName(query: string, user: User) {
    if (!query) {
      return false;
    }

    let correctInput = query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    let substrRegex = new RegExp(correctInput, 'i');
    let text = user.displayName.toLowerCase();
    return substrRegex.test(text);
  }

  openCallerIDsView(member: User) {
    this.streamService.next(
      new Stream(StreamId.SHOW_CALLERIDS_VIEW_MODAL, {
        member: member
      })
    );
  }
}

export class AclConfig {
  constructor(
    public id?: number,
    public orgUuid?: string,
    public localPath?: boolean,
    public configs: RuleConfig[] = []
  ) {}
}

export class RuleConfig {
  constructor(public identityUuid?: string, public callerIds: string[] = []) {}
}
