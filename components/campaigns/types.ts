export type Campaign = {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  createdAt: string;
  account?: {
    id: string;
    companyName: string;
  };
  _count?: {
    leads: number;
  };
};

