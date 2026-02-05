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

interface ApiResponse<T> {
  status: boolean;
  code: number;
  message: string;
  data: T;
}

export interface CompanyApplicationView {
  applicationId: number;
  userId: number; // Added userId
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

// ... (lines 33-46 omitted)

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

export const fetchCompanyApplications = async (
  jobPostingId: number,
): Promise<CompanyApplicationView[]> => {
  const response = await axios.get<ApiResponse<ApplicationListItemDto[]>>(
    `/api/job-postings/${jobPostingId}/applications`,
  );

  const list = response.data.data;

  return list.map((item) => ({
    applicationId: item.applicationId,
    userId: item.userId, // Map userId
    applicantName: item.userName,
    resumeId: String(item.resumeId),
    postingTitle: '공고 제목',
    companyName: '',
    appliedAt: item.appliedAt,
    status: mapStatusToKorean(item.status),

    experience: '경력 정보 없음',
    experienceYears: 0,
    isScrapped: false,
  }));
};
