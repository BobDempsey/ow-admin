import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  { path: 'users', title: 'Users', loadComponent: () => import('./users/users-page') },
  // Declared before `users/:id` so `new` is never read as a user id.
  { path: 'users/new', title: 'New user', loadComponent: () => import('./users/new-user-page') },
  { path: 'users/:id', title: 'User', loadComponent: () => import('./users/user-detail-page') },
  { path: 'about', title: 'About', loadComponent: () => import('./about/about-page') },
  { path: '**', redirectTo: 'users' },
];
