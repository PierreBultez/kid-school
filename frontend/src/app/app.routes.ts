import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'profiles', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'profiles',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profiles/profiles.component').then((m) => m.ProfilesComponent),
  },
  {
    path: 'play',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/play/play.component').then((m) => m.PlayComponent),
  },
];
