const BASE_URL = '/api/resumes';

interface ApiResponse<T> {
    status: boolean;
    data: T;
    message?: string;
}

export interface UploadProfileImageResponse {
    id: number;
    userId: number;
    imageUrl: string;
    imageName: string;
    createdAt: string;
}
export interface ResumeListItem {
    id: number;
    userId: number;
    title: string;
    isMain: boolean;
    profile: {
        name: string;
        email: string;
        contact: string;
        address: string;
        profileImageUrl: string | null;
    };
    lastModifiedAt: string;
}

export interface ResumeDetail extends ResumeListItem {
    careers: Array<{
        id?: number;
        company: string;
        role: string;
        periodStart: string;
        periodEnd: string;
        employmentStatus: string;
        description: string;
    }>;
    educations: Array<{
        id?: number;
        school: string;
        major: string;
        degree: string;
        periodStart: string;
        periodEnd: string;
        status: string;
    }>;
    portfolio: {
        portfolioId: number;
        originalFilename: string;
        fileUrl: string;
    } | null;
    selfIntroductions: Array<{
        id: number;
        title: string;
        answerText: string;
    }>;
}

export interface CreateResumeRequest {
    title: string;
    isMain: boolean;
}

export interface UpdateResumeRequest {
    title: string;
    isMain: boolean;
    profile: {
        name: string;
        email: string;
        contact: string | null;
        address: string | null;
        profileImageId?: number | null;
    };
    portfolio?: { portfolioId: number };
    careers: Array<{
        id?: number;
        company: string;
        role: string;
        periodStart: string;
        periodEnd: string;
        employmentStatus: string;
        description: string;
        orderIndex: number;
    }>;
    educations: Array<{
        id?: number;
        school: string;
        major: string;
        degree: string;
        periodStart: string;
        periodEnd: string;
        status: string;
        orderIndex: number;
    }>;
    selfIntroductions: Array<{
        id?: number;
        title: string;
        answerText: string;
        orderIndex: number;
    }>;
}

export const resumeApi = {
    getResumes: async (): Promise<ResumeListItem[]> => {
        const response = await fetch(BASE_URL);
        if (!response.ok) throw new Error('Failed to fetch resume list');
        const json: ApiResponse<ResumeListItem[]> = await response.json();
        return json.data;
    },

    getResumeDetail: async (resumeId: string | number): Promise<ResumeDetail> => {
        const response = await fetch(`${BASE_URL}/${resumeId}`);
        if (!response.ok) throw new Error('Failed to fetch resume detail');
        const json: ApiResponse<ResumeDetail> = await response.json();
        return json.data;
    },

    createResume: async (data: CreateResumeRequest): Promise<ResumeDetail> => {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create resume');
        const json: ApiResponse<ResumeDetail> = await response.json();
        return json.data;
    },

    updateResume: async (resumeId: string | number, data: UpdateResumeRequest): Promise<void> => {
        const response = await fetch(`${BASE_URL}/${resumeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || `Server Error: ${response.status}`);
            } catch (e) {
                throw new Error(`Server Error: ${response.status} - ${errorText.substring(0, 50)}...`);
            }
        }
    },

    deleteResume: async (resumeId: string | number): Promise<void> => {
        const response = await fetch(`${BASE_URL}/${resumeId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete resume');
    },

    uploadProfileImage: async (file: File): Promise<UploadProfileImageResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/profile-images/me', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server 500 Error Body:', errorText);

            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || '프로필 이미지 업로드 실패 (서버 오류)');
            } catch (e) {
                throw new Error(`서버 오류 (${response.status}): ${errorText.substring(0, 100)}`);
            }
        }

        const json: ApiResponse<UploadProfileImageResponse> = await response.json();
        return json.data;
    },
};