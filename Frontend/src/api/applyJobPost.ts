export async function fetchJobPostDetail(id: number) {
  const response = await fetch(`/api/job-postings/${id}`);

  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  const rawData = json.data;

  if (!rawData) return null;

  return {
    jobPost: {
      id: rawData.id,
      title: rawData.title,
      status: rawData.active === 1 ? 'OPEN' : 'CLOSED',
      deadline: rawData.endDate,
    },
    company: rawData.company || {
      id: 0,
      companies_name: rawData.companyName || '회사 정보 없음',
    },
  };
}

export async function applyJobPost(jobPostId: number, body: { resumeId: string }): Promise<void> {
  const response = await fetch(`/api/job-postings/${jobPostId}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    try {
      const errJson = await response.json();
      throw new Error(errJson.message || '공고 지원에 실패했습니다.');
    } catch {
      throw new Error('공고 지원에 실패했습니다.');
    }
  }
}
