import { User } from './pizzaService';

// Returns a message for each rule the user breaks; an empty list means the user is valid.
// Add new rules here (such as password complexity) so every form shares them.
export function validateUser(user: User): string[] {
  const errors: string[] = [];

  if (!user.name?.trim()) {
    errors.push('Name is required');
  }

  const email = user.email?.trim();
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+$/.test(email)) {
    errors.push('Email must be a valid address');
  }

  return errors;
}
