import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IAM_GROUP_UUIDS } from '../iam/iam.constant';
import { MeIamState, MeIamStore } from './me-iam.store';

@Injectable({ providedIn: 'root' })
export class MeIamQuery extends QueryEntity<MeIamState> {
  permissions$ = this.selectAll();

  allGroupPermissions$ = this.select().pipe(map(s => s.iamGroups));

  // group
  get hasGrantedManageContact() {
    return this.getValue().iamGroups.some(g => g.uuid === IAM_GROUP_UUIDS.contact);
  }

  get hasGrantedManagePeople() {
    return this.getValue().iamGroups.some(g => g.uuid === IAM_GROUP_UUIDS.people);
  }

  get hasGrantedManagePhoneSystem() {
    return this.getValue().iamGroups.some(g => g.uuid === IAM_GROUP_UUIDS.phoneSystem);
  }

  get hasGrantedManageDevHub() {
    return this.getValue().iamGroups.some(g => g.uuid === IAM_GROUP_UUIDS.developer);
  }

  get hasGrantedManageAttendant() {
    return this.getValue().iamGroups.some(g => g.uuid === IAM_GROUP_UUIDS.autoAttendant);
  }

  get hasGrantedManageSIP() {
    return this.getValue().iamGroups.some(g => g.uuid === IAM_GROUP_UUIDS.sip);
  }

  get hasGrantedManageBizHub() {
    return this.getValue().iamGroups.some(g => g.uuid === IAM_GROUP_UUIDS.businessHub);
  }

  get hasGrantedManageFileExplorer() {
    return this.getValue().iamGroups.some(g => g.uuid === IAM_GROUP_UUIDS.fileExplorer);
  }

  get hasGrantedManageDashboard() {
    return this.getValue().iamGroups.some(g => g.uuid === IAM_GROUP_UUIDS.dashboard);
  }

  selectGrantedManageBizHub() {
    return this.allGroupPermissions$.pipe(map(groups => groups.some(g => g.uuid === IAM_GROUP_UUIDS.businessHub)));
  }

  selectGrantedManageDashboard() {
    return this.allGroupPermissions$.pipe(map(groups => groups.some(g => g.uuid === IAM_GROUP_UUIDS.dashboard)));
  }

  selectGrantedGroup(iamGroupUuid: string) {
    return this.allGroupPermissions$.pipe(map(groups => groups.some(g => g.uuid === iamGroupUuid)));
  }

  constructor(protected override store: MeIamStore) {
    super(store);
  }

  selectAllAllowedByService(service: string) {
    return this.selectAll({ filterBy: e => e.isService(service) });
  }

  selectAllowedByServiceAndAction(service: string, action: string) {
    return this.selectAll({
      filterBy: e => e.isAllowedAction(service, action)
    });
  }

  selectHasGrantedPermission(service: string, action: string): Observable<boolean> {
    return this.selectCount(e => e.isAllowedAction(service, action)).pipe(map(value => value > 0));
  }

  hasGrantedAction(service: string, action: string): boolean {
    return this.getAll({ filterBy: e => e.isAllowedAction(service, action) }).length > 0;
  }

  hasGrantedResource(service: string, action: string, resource: string): boolean {
    return this.getAll({ filterBy: e => e.isAllowResource(service, action, resource) }).length > 0;
  }

  getAllAllowedByService(service: string) {
    return this.getAll({ filterBy: e => e.isService(service) });
  }
}
