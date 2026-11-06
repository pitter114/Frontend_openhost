import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { OrganizacionService } from '../services/organizacion.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) return true;

  router.navigate(['/login']);
  return false;
};

/** Guards areas that additionally require an active organization context. */
export const organizacionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const org = inject(OrganizacionService);
  const router = inject(Router);

  if (!auth.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }

  if (!org.orgActivaId()) {
    router.navigate(['/organizaciones']);
    return false;
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaAutenticado()) return true;

  router.navigate(['/organizaciones']);
  return false;
};

/** Guards the superadmin area — requires an active org where the member has an openhost-* role. */
export const openHostAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const org = inject(OrganizacionService);
  const router = inject(Router);

  if (!auth.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }

  if (!org.orgActivaId()) {
    router.navigate(['/organizaciones']);
    return false;
  }

  if (!org.esOpenHostAdmin()) {
    router.navigate(['/admin/panel']);
    return false;
  }

  return true;
};