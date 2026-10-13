import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/showcase/pages/showcase/showcase').then((m) => m.Showcase),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'ong',
    canActivate: [authGuard],
    loadComponent: () => import('./features/management/pages/pets/pets').then((m) => m.MyPets),
  },
  {
    path: 'ong/novo',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./features/management/pages/pet-editor/pet-editor').then((m) => m.PetEditor),
  },
  {
    path: 'ong/:id/editar',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./features/management/pages/pet-editor/pet-editor').then((m) => m.PetEditor),
  },
  { path: '**', redirectTo: '' },
];
