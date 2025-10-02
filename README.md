import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WhatsappStatusCheckService {
  private role: string = 'guest';
  private permissions: string[] = [];

  setRole(role: string) {
    this.role = role;
  }

  getRole(): string {
    return this.role;
  }

  setPermissions(permissions: string[]) {
    this.permissions = permissions;
  }

  getPermissions(): string[] {
    return this.permissions;
  }

  isLoggedIn(): boolean {
    return this.role !== 'guest';
  }
}


import { APP_INITIALIZER, Provider } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApicontrollerService } from './controller/apicontroller.service';
import { WhatsappStatusCheckService } from './Services/whatsapp-status-check.service';

export function appInitializerFactory(
  apiController: ApicontrollerService,
  whatsappStatus: WhatsappStatusCheckService
) {
  return () => {
    return firstValueFrom(
      apiController.fetchApiRoleAndPermission().pipe(
        catchError((error) => {
          console.warn('No token or API failed → fallback to guest', error);

          // 👇 Agar token missing hai ya error aaya to guest role set kar do
          whatsappStatus.setRole('guest');
          whatsappStatus.setPermissions([]);

          // Empty observable return karo taki app bootstrap ho jaye
          return of(null);
        })
      )
    ).then((resp: any) => {
      if (resp?.data?.role) {
        whatsappStatus.setRole(resp.data.role);
        whatsappStatus.setPermissions(resp.data.permissions || []);
      }
    });
  };
}

export const APP_INIT_PROVIDER: Provider = {
  provide: APP_INITIALIZER,
  useFactory: appInitializerFactory,
  deps: [ApicontrollerService, WhatsappStatusCheckService],
  multi: true,
};
