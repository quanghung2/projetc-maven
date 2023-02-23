import { finalize } from 'rxjs/operators';
import { AuthSecurityService } from './../core/services/auth/auth-security.service';
import { SecurityPolicy } from './../core/models/security-policy.model';
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';

declare const X;

@Component({
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss']
})
export class SecurityComponent implements OnInit {
  isLoading = true;
  isUpdating = false;

  initialConfig: SecurityPolicy;
  config: SecurityPolicy;

  ipRegex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  ipWhitelisting: boolean;
  allowedIPs: UntypedFormControl[] = [];

  constructor(private authSecurityService: AuthSecurityService) {}

  ngOnInit() {
    this.authSecurityService
      .getSecurityPolicy()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.initialConfig = res;
          this.initialConfig.webSessionTimeoutInMinutes = this.initialConfig.webSessionTimeoutInMinutes || 0;
          this.config = new SecurityPolicy(this.initialConfig);
          this.ipWhitelisting = !!this.config.allowedIPs && this.config.allowedIPs.length > 0;
          this.allowedIPs = this.config.allowedIPs.map(
            ip =>
              new UntypedFormControl(ip, Validators.compose([Validators.required, Validators.pattern(this.ipRegex)]))
          );
        },
        err => {
          X.showWarn('Could not load config!');
          console.log(err);
        }
      );
  }

  hasChanges() {
    return (
      JSON.stringify(this.config) !== JSON.stringify(this.initialConfig) ||
      (this.ipWhitelisting && this.allowedIPs.findIndex(ip => ip.dirty) > -1) ||
      (this.config.allowedIPs.length > 0 && !this.ipWhitelisting)
    );
  }

  isAllIpValid() {
    return this.allowedIPs.findIndex(ip => ip.invalid) === -1;
  }

  reset() {
    this.config = new SecurityPolicy(this.initialConfig);
  }

  save() {
    this.isUpdating = true;
    if (this.ipWhitelisting) {
      this.config.allowedIPs = this.allowedIPs.map(ip => ip.value);
    } else {
      this.config.allowedIPs = [];
    }
    this.authSecurityService
      .updateSecurityPolicy(this.config)
      .pipe(finalize(() => (this.isUpdating = false)))
      .subscribe(
        () => {
          this.initialConfig = new SecurityPolicy(this.config);
          X.showSuccess('Saved successfully!');
        },
        err => {
          X.showWarn('Could not save changes!');
          console.log(err);
        }
      );
  }

  addIpInput() {
    this.allowedIPs.push(
      new UntypedFormControl('', Validators.compose([Validators.required, Validators.pattern(this.ipRegex)]))
    );
  }

  removeIp(ip: UntypedFormControl) {
    const idx = this.allowedIPs.indexOf(ip);
    this.allowedIPs.splice(idx, 1);
  }
}
