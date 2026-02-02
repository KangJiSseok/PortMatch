export interface Company {
  cid: string;
  corpName: string;
  totPsncnt?: string;
  busiSize?: string;
  yrSalesAmt?: string;
  corpAddr?: string;
  homePg?: string;
  busiCont?: string;
  logo?: string;
}

export interface JobPostingResponse {
  id: number;
  title: string;
  active: number;
  startDate: string;
  endDate: string;
  vcnt: number;
  cid: string;
  detail: string;
  jobType: number;
  company: Company;
  stackIds: number[];
}

export const getCompanyJobs = async (cid: string): Promise<JobPostingResponse[]> => {
  const response = await fetch(`/api/job-postings/company/${cid}`);
  const result = await response.json();
  if (!result.status) throw new Error(result.message);
  return result.data;
};
