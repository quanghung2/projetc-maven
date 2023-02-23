import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CreateRequest, QueueConfig, QueueInfo } from './queue.model';

@Injectable({
  providedIn: 'root'
})
export class QueueService {
  queues: QueueInfo[];

  constructor(private http: HttpClient) {}

  createQueue(data: CreateRequest) {
    const url = `callcenter/private/v1/queues`;
    const req = {
      label: data.label,
      genieCode: data.genieCode,
      clonedFromQueueUuid: null
    };

    if (data.clonedQueue) {
      req.clonedFromQueueUuid = data.clonedQueue.uuid;
    }

    return this.http.post<QueueConfig>(url, req);
  }

  createQueueV2(queue: Partial<QueueConfig>): Observable<QueueConfig> {
    return this.http.post<QueueConfig>(`callcenter/private/v2/queues`, queue);
  }

  loadQueueList(): Observable<QueueInfo[]> {
    return this.http.get<QueueInfo[]>(`callcenter/private/v1/config/queues`).pipe(
      map(res => {
        this.queues = res.map(item => new QueueInfo(item));
        return this.queues;
      })
    );
  }

  getQueuesFromCache(): Observable<QueueInfo[]> {
    if (!this.queues) {
      return this.loadQueueList();
    }

    return of(this.queues);
  }

  getQueueConfig(queueUuid: string): Observable<QueueConfig> {
    return this.http
      .get<QueueConfig>(`callcenter/private/v1/queues/${queueUuid}/config`)
      .pipe(map(config => new QueueConfig(config)));
  }

  updateQueueConfig(queueUuid: string, config: Partial<QueueConfig>): Observable<QueueConfig> {
    return this.http.put<QueueConfig>(`callcenter/private/v2/queues/${queueUuid}`, config);
  }

  deleteQueue(queueUuid: string): Observable<any> {
    return this.http.delete(`callcenter/private/v1/queues/${queueUuid}`);
  }

  assignAgent(queueUuid: string, identityUuid: string) {
    const req = { identityUuid: identityUuid };
    return this.http.post(`callcenter/private/v1/queues/${queueUuid}/agents/assign`, req);
  }

  unassignAgent(queueUuid: string, identityUuid: string) {
    const req = { identityUuid: identityUuid };
    return this.http.post(`callcenter/private/v1/queues/${queueUuid}/agents/unassign`, req);
  }
}
