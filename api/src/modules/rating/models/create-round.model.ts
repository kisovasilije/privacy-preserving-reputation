export interface CreateRound {
  title: string;
  description?: string;
  opensAt: Date | string;
  closesAt: Date | string;
  authorId: number;
}
