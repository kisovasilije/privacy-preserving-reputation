export interface Rating {
  readonly id: number;
  comment?: string;
  readonly raterId: number | null;
  readonly roundId: number | null;
  readonly targetId: number | null;
}
