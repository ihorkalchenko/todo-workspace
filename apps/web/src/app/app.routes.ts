import { Route } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then(m => m.LoginPage),
    title: 'Todo - Login'
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/signup/signup').then(m => m.SignupPage),
    title: 'Todo - Sign up'
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
    children: [
      {
        path: 'tasks',
        loadComponent: () => import('./pages/dashboard/tasks/tasks').then(m => m.TasksPage),
        title: 'Todo - Tasks',
        data: { title: 'Tasks' }
      },
      {
        path: 'tasks/new',
        loadComponent: () => import('./pages/dashboard/tasks/task-details/task-details').then(m => m.TaskDetailsPage),
        title: 'Todo - New Task',
        data: { title: 'New Task' }
      },
      {
        path: 'tasks/:id',
        loadComponent: () => import('./pages/dashboard/tasks/task-details/task-details').then(m => m.TaskDetailsPage),
        title: 'Todo - Edit Task',
        data: { title: 'Edit Task' }
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/dashboard/settings/settings').then(m => m.SettingsPage),
        title: 'Todo - Settings',
        data: { title: 'Settings' }
      },
      {
        path: '',
        redirectTo: 'tasks',
        pathMatch: 'full'
      }
    ]
  },
];
