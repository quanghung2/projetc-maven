import { forwardRef, Inject, Injectable } from '@angular/core';
import { BackendService } from './backend.service';

const CONTACT_PATH = '/private/v2/contacts';

@Injectable()
export class ContactService {
  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService
  ) {}

  send(body: any) {
    return this.backendService.post(CONTACT_PATH, body);
  }
}
