export type UserRole = 'APPLICANT' | 'COMPANY' | 'ADMIN';

export interface LoginRequest {
  email: string;
  password: string;
  expectedRole: UserRole;
}

export interface UserData {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export type LoginResponse = ApiResponse<UserData>;

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
  experienceYears: number;
}

export interface CompanySignupRequest {
  email: string;
  password: string;
  companyName: string;
  businessNumber: string;
  managerName: string;
  managerPhone: string;
  address: string;
  companySize: string;
  homepageUrl?: string | null;
}

export interface AuthState {
  user: UserData | null;
  isLoggedIn: boolean;
  setAuth: (user: UserData) => void;
  clearAuth: () => void;
}
