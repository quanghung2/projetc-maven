import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

declare const X: any;

@Injectable({ providedIn: 'root' })
export class ListManagementService {
  constructor(private http: HttpClient) {}

  search(params): Observable<any> {
    const page = params.searchStr ? 1 : params.pagination.currentPage;
    return Observable.create(observer => {
      this.http
        .get(`/dnc/api/v2/private/consents`, {
          params: {
            page: page,
            perPage: params.pagination.perPage,
            number: params.searchStr
          },
          observe: 'response'
        })
        .subscribe(
          res => {
            observer.next({
              totalCount: res.headers.get('x-hoiio-pagination-total-count'),
              entries: res.body
            });
            observer.complete();
          },
          res => {
            observer.error(res);
          }
        );
    });
  }

  update(number, type, status): Observable<any> {
    return Observable.create(observer => {
      const params: any = {};
      if (type == 'voice') {
        params.voice = status;
      } else if (type == 'fax') {
        params.fax = status;
      } else if (type == 'sms') {
        params.sms = status;
      }
      this.http.put(`/dnc/api/v2/private/consents/${number}`, params).subscribe(
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

  add(number, voice, fax, sms): Observable<any> {
    return Observable.create(observer => {
      this.http
        .put(`/dnc/api/v2/private/consents/${number}`, {
          voice: voice,
          fax: fax,
          sms: sms
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

  delete(number): Observable<any> {
    return Observable.create(observer => {
      this.http.delete(`/dnc/api/v2/private/consents/${number}`).subscribe(
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

  export(email): Observable<any> {
    return Observable.create(observer => {
      this.http
        .get(`/dnc/api/v2/private/consents/_export`, {
          params: {
            number: '',
            email: email
          }
        })
        .subscribe(
          res => {
            observer.next({});
            observer.complete();
          },
          res => {
            observer.error(res);
          }
        );
    });
  }

  import(tempKey): Observable<any> {
    return Observable.create(observer => {
      this.http.put(`/dnc/api/v2/private/consents/_bulk`, { tempKey }).subscribe(
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

  getAllOrgLink() {
    return Observable.create(observer => {
      this.http.get(`/dnc/api/v2/private/consents/org-links`).subscribe(
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

  getMasterOrg() {
    return Observable.create(observer => {
      this.http.get(`/dnc/api/v2/private/consents/org-links/${X.orgUuid}`).subscribe(
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

  updateOrgLink(orgUuids: string[]) {
    return Observable.create(observer => {
      this.http
        .put(`/dnc/api/v2/private/consents/org-links`, {
          masterOrg: X.orgUuid,
          slaveOrgs: orgUuids
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

  deleteOrgLink(orgUuid: string) {
    return Observable.create(observer => {
      this.http.delete(`/dnc/api/v2/private/consents/org-links/${orgUuid}`).subscribe(
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
}
