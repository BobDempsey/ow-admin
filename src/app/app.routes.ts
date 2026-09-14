import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  { path: 'users', title: 'Users', loadComponent: () => import('./users/users-page') },
  { path: 'users/:id', title: 'User', loadComponent: () => import('./users/user-detail-page') },
  { path: '**', redirectTo: 'users' },
];
