export interface PortfolioResponse {
  id: number;
  userId: number;
  originalFilename: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface Project {
  name: string;
  domain: string;
  problem: string;
  solution: string;
  tech: string[];
  architecture_experience: string[];
  keywords: string[];
}

export interface AnalysisResponse {
  projects: Project[];
}

export interface SavedPortfolio {
  id: number | string;
  name: string;
  status: boolean;
  fileUrl?: string;
  isLocal?: boolean;
}

export interface AnalysisData {
  projects: Project[];
  strengths: string[];
  techStacks: string[];
}