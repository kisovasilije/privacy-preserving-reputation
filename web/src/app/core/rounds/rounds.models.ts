export interface OpenedRound {
  id: number;
  title: string;
  description: string | null;
  opensAt: string;
  closesAt: string;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoundRequest {
  title: string;
  description?: string;
  opensAt?: string;
  closesAt: string;
}
