import axios from 'axios';

export interface ApplicationListItemDto {
  applicationId: number;
  userId: number;
  userName: string;
  resumeId: number;
  resumeTitle: string;
  status: 'APPLIED' | 'PASS' | 'FAIL' | 'READ';
  appliedAt: string;
}

export interface CareerDto {
  periodStart: string;
  periodEnd: string;
}

export interface ApplicationDetailDto {
  applicationId: number;
  resume: {
    careers: CareerDto[];
  };
}

interface ApiResponse<T> {
  status: boolean;
  code: number;
  message: string;
  data: T;
}

export interface CompanyApplicationView {
  applicationId: number;
  applicantName: string;
  resumeId: string;
  postingTitle: string;
  companyName: string;
  appliedAt: string;
  status: string;
  experience: string;
  experienceYears: number;
  isScrapped: boolean;
}

const mapStatusToKorean = (status: string): string => {
  switch (status) {
    case 'APPLIED':
      return '미열람';
    case 'READ':
      return '열람';
    case 'PASS':
      return '합격';
    case 'FAIL':
      return '불합격';
    default:
      return '미열람';
  }
};

const calculateExperience = (careers: CareerDto[]): { text: string; years: number } => {
  if (!careers || careers.length === 0) {
    return { text: '신입', years: 0 };
  }

  let totalMonths = 0;

  careers.forEach((career) => {
    const start = new Date(career.periodStart);
    const end = career.periodEnd ? new Date(career.periodEnd) : new Date();

    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();

    totalMonths += years * 12 + months;
  });

  const totalYears = Math.floor(totalMonths / 12);

  if (totalYears === 0) return { text: '1년 미만', years: 0 };
  return { text: `${totalYears}년차`, years: totalYears };
};

export const fetchCompanyApplications = async (
  jobPostingId: number,
): Promise<CompanyApplicationView[]> => {
  const listResponse = await axios.get<ApiResponse<ApplicationListItemDto[]>>(
    `/api/job-postings/${jobPostingId}/applications`,
  );

  const listData = listResponse.data.data;

  const detailPromises = listData.map((item) =>
    axios.get<ApiResponse<ApplicationDetailDto>>(
      `/api/job-postings/${jobPostingId}/applications/${item.applicationId}`,
    ),
  );

  const detailResponses = await Promise.all(detailPromises);
  const detailMap = new Map<number, ApplicationDetailDto>();

  detailResponses.forEach((res) => {
    const detail = res.data.data;
    detailMap.set(detail.applicationId, detail);
  });

  return listData.map((item) => {
    const detail = detailMap.get(item.applicationId);
    const careers = detail?.resume?.careers ?? [];
    const { text, years } = calculateExperience(careers);

    return {
      applicationId: item.applicationId,
      applicantName: item.userName,
      resumeId: String(item.resumeId),
      postingTitle: '지원자 관리',
      companyName: '',
      appliedAt: item.appliedAt,
      status: mapStatusToKorean(item.status),
      experience: text,
      experienceYears: years,
      isScrapped: false,
    };
  });
};
