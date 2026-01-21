export type UserRole = 'APPLICANT' | 'COMPANY';

export interface LoginRequest {
  email: string;
  password: string;
  expectedRole: UserRole;
}

export interface LoginResponse {
  token: string;
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface SignupBaseRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface ApplicantSignupRequest extends SignupBaseRequest {
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  gender: string;
  experienceYears: string;
}

export interface CompanySignupRequest extends SignupBaseRequest {
  companyName: string;
  businessRegNo: string;
  homepageUrl?: string;
  address: string;
  companySize: string;
}
