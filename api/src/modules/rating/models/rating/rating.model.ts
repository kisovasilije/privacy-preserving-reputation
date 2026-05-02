export interface Rating {
  readonly id: number;
  value: number;
  comment?: string;
  readonly raterId: number;
  readonly roundId: number;
  readonly targetId: number;
}
