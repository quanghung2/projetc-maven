import { MemberInfoModel } from './../shared/modal/member.model';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { zip, map } from 'rxjs/operators';
import { CacheService, ExportService } from '../shared';

declare const X: any;

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  memberList: any = [];
  dpoList: any = [];
  managerList: any = [];
  agentList: any = [];
  uuidAgentList: string[] = [];

  constructor(private http: HttpClient, private cacheService: CacheService, private exportService: ExportService) {}

  loadData(members: MemberInfoModel[]): Observable<any> {
    return Observable.create(observer => {
      let orgUuid = X.orgUuid;
      this.http
        .get<any[]>(`/dnc/api/v2/private/subscriptions/agents`, {
          params: {
            statues: 'legacy,active,expired,notFound,terminated'
          }
        })
        .subscribe(
          res => {
            let agents = res;
            let managers = [];
            let dpos = [];
            let staffs = [];
            let nonStaffs = [];

            members.forEach(member => {
              if (member.role == 'OWNER') {
                dpos.push(member);
              }
            });

            agents.forEach(agent => {
              let f = false;
              agent.displayName = agent.agentName;
              agent.email = agent.agentEmail;
              if (!agent.displayName) {
                agent.displayName = agent.agentEmail;
              }
              if (!agent.displayName) {
                agent.displayName = agent.agentUuid;
              }
              members.forEach(member => {
                if (agent.agentUuid == member.uuid) {
                  agent.info = member;
                  if (member.role == 'GUEST') {
                    nonStaffs.push(agent);
                  } else {
                    if (agent.agentType == 'dpoLicence') {
                      dpos.push(agent);
                    } else if (agent.agentType == 'managerLicence') {
                      managers.push(agent);
                    } else {
                      staffs.push(agent);
                    }
                  }
                  f = true;
                }
              });
              if (!f) {
                if (agent.agentType == 'dpoLicence') {
                  dpos.push(agent);
                } else if (agent.agentType == 'managerLicence') {
                  managers.push(agent);
                } else {
                  nonStaffs.push(agent);
                }
              }
            });

            this.memberList = members;
            this.managerList = managers;
            this.dpoList = dpos;
            this.agentList = agents;
            this.uuidAgentList = agents.map(x => x.agentUuid);

            observer.next({
              members: members,
              managers: managers,
              dpos: dpos,
              agents: agents,
              staffs: staffs,
              nonStaffs: nonStaffs
            });
            observer.complete();
          },
          res => {
            observer.error(res);
          }
        );
    });
  }

  getMembers(page: number, size = 1000): Observable<MemberInfoModel[]> {
    let orgUuid = X.orgUuid;
    return this.http
      .get<MemberInfoModel[]>(`/auth/private/v1/organizations/${orgUuid}/members`, {
        params: {
          page: page.toString(),
          size: size.toString()
        }
      })
      .pipe(map((res: any) => res.map(item => new MemberInfoModel(item))));
  }

  getFreeMembersByKeyworkIgnoreAgent(keyword: string, size: string): Observable<MemberInfoModel[]> {
    let orgUuid = X.orgUuid;
    const params = {
      page: '0',
      size
    };
    if (keyword) {
      params['keyword'] = keyword;
    }

    return this.http
      .get<MemberInfoModel[]>(`/auth/private/v1/organizations/${orgUuid}/members`, { params })
      .pipe(
        map((res: any) => res.map(item => new MemberInfoModel(item))),
        map((members: MemberInfoModel[]) => {
          return members.filter(item => this.uuidAgentList.indexOf(item.uuid) === -1);
        })
      );
  }

  resendMagicLink(agentUuid): Observable<any> {
    return Observable.create(observer => {
      this.http
        .post(`/dnc/api/v2/private/subscriptions/sendMagicLink`, {
          agentUuid: agentUuid
        })
        .subscribe(
          res => {
            observer.next(res);
            observer.complete();
          },
          res => {
            observer.error(res);
          }
        );
    });
  }

  unassignAgent(agentUuid): Observable<any> {
    return Observable.create(observer => {
      this.http.delete(`/dnc/api/v2/private/subscriptions/agents/${agentUuid}`).subscribe(
        res => {
          observer.next(res);
          observer.complete();
        },
        res => {
          observer.error(res);
        }
      );
    });
  }

  assignAgent(agentUuid, email, agentType): Observable<any> {
    return Observable.create(observer => {
      let params: any = {
        agentType: agentType
      };
      if (agentUuid) {
        params.agentUuid = agentUuid;
      }
      if (email) {
        params.email = email;
      }
      this.http.post(`/dnc/api/v2/private/subscriptions/agents`, params).subscribe(
        res => {
          observer.next(res);
          observer.complete();
        },
        res => {
          observer.error(res);
        }
      );
    });
  }

  enableAgent(agentUuid): Observable<any> {
    let userInfo = this.cacheService.get('user-info');
    return Observable.create(observer => {
      this.http
        .put(`/auth/private/v1/organizations/${X.orgUuid}/members/${agentUuid}`, {
          status: 'ACTIVE',
          domain: userInfo.company.domain
        })
        .subscribe(
          res => {
            observer.next(res);
            observer.complete();
          },
          res => {
            observer.error(res);
          }
        );
    });
  }

  disableAgent(agentUuid): Observable<any> {
    let userInfo = this.cacheService.get('user-info');
    return Observable.create(observer => {
      this.http
        .put(`/auth/private/v1/organizations/${X.orgUuid}/members/${agentUuid}`, {
          status: 'DISABLED',
          domain: userInfo.company.domain
        })
        .pipe(zip(this.http.delete(`/dnc/api/v2/private/subscriptions/agents/${agentUuid}`, {})))
        .subscribe(
          res => {
            observer.next(res);
            observer.complete();
          },
          res => {
            observer.error(res);
          }
        );
    });
  }

  convertLegacyAgent(agentUuid): Observable<any> {
    let userInfo = this.cacheService.get('user-info');
    return Observable.create(observer => {
      this.http.put(`/dnc/api/v2/private/subscriptions/agents/${agentUuid}/convert`, {}).subscribe(
        res => {
          observer.next(res);
          observer.complete();
        },
        res => {
          observer.error(res);
        }
      );
    });
  }

  setExpiredDate(agentUuid, expiredDate): Observable<any> {
    let userInfo = this.cacheService.get('user-info');
    return Observable.create(observer => {
      this.http
        .put(`/dnc/api/v2/private/subscriptions/agents`, {
          agentUuid: agentUuid,
          expiredDate: expiredDate
        })
        .subscribe(
          res => {
            observer.next(res);
            observer.complete();
          },
          res => {
            observer.error(res);
          }
        );
    });
  }

  exportAgent(): Observable<any> {
    return Observable.create(observer => {
      this.http
        .get<any[]>(`/dnc/api/v2/private/subscriptions/agents`, {
          params: {
            statues: 'legacy,active,expired,notFound,terminated'
          }
        })
        .subscribe(
          res => {
            let csvContent = `Uuid,Name,Email,Role,Status,Expired Date\n`;
            let result = res;
            for (let numberIndex = 0; numberIndex < result.length; numberIndex++) {
              let agent = result[numberIndex];
              csvContent += `${agent.agentUuid},${agent.agentName ? agent.agentName : ''},${
                agent.agentEmail ? agent.agentEmail : ''
              },${agent.agentType.replace('Licence', '')},${agent.status},${
                agent.expiredDate ? agent.expiredDate : ''
              }\n`;
            }
            this.exportService.exportCsv(csvContent, 'agent_list');
            observer.next({});
            observer.complete();
          },
          res => {
            observer.error(res);
          }
        );
    });
  }
}
