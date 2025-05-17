import { atom } from 'nanostores';

export interface User {
  email: string;
  idp: string;
  pic: string;
}

export const baseUrl = import.meta.env.PUBLIC_SVC_URL;

export const userStore = atom<User | null>(null);

export const setUser = (user: User | null) => {
  userStore.set(user);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

const storedUser = localStorage.getItem('user');
if (storedUser) {
  try {
    userStore.set(JSON.parse(storedUser));
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    localStorage.removeItem('user');
  }
}

