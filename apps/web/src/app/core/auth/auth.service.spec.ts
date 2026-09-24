import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { User } from '@todo-workspace/users';
import { AuthService } from './auth.service';
import { AuthDataService } from './auth-data.service';

describe('AuthService', () => {
  let store: InstanceType<typeof AuthService>;

  const mockUser: User = {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    avatar: null,
  };

  const mockAuthDataService = {
    getMe: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    updateMe: vi.fn(),
    uploadAvatar: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthDataService, useValue: mockAuthDataService },
      ],
    });

    store = TestBed.inject(AuthService);
  });

  it('should initialize with user = null', () => {
    expect(store.user()).toBeNull();
  });

  it('should update user on successful login', () => {
    mockAuthDataService.login.mockReturnValue(of({ user: mockUser }));
    store.login({ email: 'alice@example.com', password: 'password' }).subscribe();

    expect(store.user()).toEqual(mockUser);
  });

  it('should clear user on logout', () => {
    mockAuthDataService.login.mockReturnValue(of({ user: mockUser }));
    store.login({ email: 'alice@example.com', password: 'password' }).subscribe();
    expect(store.user()).toEqual(mockUser);

    mockAuthDataService.logout.mockReturnValue(of({ message: 'Logged out' }));
    store.logout().subscribe();

    expect(store.user()).toBeNull();
  });

  it('should update user on avatar upload', () => {
    const updatedUser = { ...mockUser, avatar: '/uploads/avatars/avatar-1.png' };
    mockAuthDataService.uploadAvatar.mockReturnValue(of(updatedUser));
    store.uploadAvatar(new File([], 'avatar.png')).subscribe();

    expect(store.user()).toEqual(updatedUser);
  });
});
