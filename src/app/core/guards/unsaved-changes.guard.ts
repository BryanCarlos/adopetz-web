import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
export interface UnsavedChanges {
  hasUnsavedChanges(): boolean;
}
export const unsavedChangesGuard: CanDeactivateFn<UnsavedChanges> = (component) =>
  !inject(AuthService).accessToken() ||
  !component.hasUnsavedChanges() ||
  window.confirm('Há alterações não salvas. Deseja sair e descartá-las?');
