import { User } from '../user.entity';

export class UserCreatedEvent {
  constructor(public readonly user: User) {}
}
