import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject} from '@angular/core';
import { Router} from '@angular/router';
import { tap } from 'rxjs';

import { User } from '@todo-workspace/users';
import { AuthDataService } from './auth-data.service';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
};

export const AuthService = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((
    store,
    authDataService = inject(AuthDataService),
    router = inject(Router),
  ) => ({
    getMe() {
      patchState(store, { isLoading: true });

      return authDataService
        .getMe()
        .pipe(
          tap({
            next: ({ user }) => patchState(store, { user, isLoading: false }),
            error: () => patchState(store, { isLoading: false }),
          }),
        );
    },

    login(credentials: Record<string, unknown>) {
      patchState(store, { isLoading: true });

      return authDataService
        .login(credentials)
        .pipe(
          tap({
            next: ({ user }) => patchState(store, { user, isLoading: false }),
            error: () => patchState(store, { isLoading: false }),
          }),
        );
    },

    signup(data: Record<string, unknown>) {
      patchState(store, { isLoading: true });

      return authDataService
        .signup(data)
        .pipe(
          tap({
            next: ({ user }) => patchState(store, { user, isLoading: false }),
            error: () => patchState(store, { isLoading: false }),
          }),
        );
    },

    refresh() {
      return authDataService
        .refresh()
        .pipe(
          tap({
            next: ({ user }) => patchState(store, { user, isLoading: false }),
            error: () => patchState(store, { isLoading: false }),
          }),
        );
    },

    logout() {
      patchState(store, { isLoading: true });

      return authDataService
        .logout()
        .pipe(
          tap({
            next: () => patchState(store, { user: null, isLoading: false }),
            error: () => patchState(store, { isLoading: false }),
          }),
        );
    },

    updateMe(data: Partial<User>) {
      return authDataService
        .updateMe(data)
        .pipe(
          tap((updatedUser) => patchState(store, { user: updatedUser })),
        );
    },

    uploadAvatar(file: File) {
      return authDataService
        .uploadAvatar(file)
        .pipe(
          tap((updatedUser) => patchState(store, { user: updatedUser })),
        );
    },

    clearUser() {
      patchState(store, { user: null });
      router.navigate(['/login']);
    },
  })),
);
