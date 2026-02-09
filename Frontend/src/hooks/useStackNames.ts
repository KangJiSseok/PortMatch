// src/hooks/useStackNames.ts
import { useEffect, useMemo, useRef, useState } from 'react';

type StackApiResponse = {
  status: boolean;
  code: number;
  message: string;
  data: {
    stackId: number;
    stackName: string;
  };
};

type StackNameMap = Record<number, string>;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function fetchStackName(stackId: number): Promise<{ id: number; name: string }> {
  const res = await fetch(`${API_BASE_URL}/api/stacks/${stackId}`, {
    method: 'GET',
    headers: { accept: '*/*' },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch stack ${stackId}: ${res.status}`);
  }

  const json = (await res.json()) as StackApiResponse;
  return { id: json.data.stackId, name: json.data.stackName };
}

/**
 * 단건 조회(/api/stacks/{id})밖에 없을 때,
 * 화면에 필요한 stackIds만 모아서 비동기로 이름을 가져오고 캐싱해주는 훅.
 *
 * - 이미 가져온 id는 재요청하지 않음
 * - 실패해도 화면은 유지 (fallback로 #id 사용 가능)
 * - 중복 요청 방지
 */
export function useStackNames(stackIds: number[]) {
  const [map, setMap] = useState<StackNameMap>({});
  const inFlightRef = useRef<Set<number>>(new Set());

  const uniqueIds = useMemo(() => {
    const set = new Set<number>();
    stackIds.forEach((id) => {
      if (Number.isFinite(id) && id > 0) set.add(id);
    });
    return Array.from(set);
  }, [stackIds]);

  useEffect(() => {
    const need = uniqueIds.filter((id) => !map[id] && !inFlightRef.current.has(id));
    if (need.length === 0) return;

    need.forEach((id) => {
      inFlightRef.current.add(id);

      fetchStackName(id)
        .then(({ id: fetchedId, name }) => {
          setMap((prev) => ({ ...prev, [fetchedId]: name }));
        })
        .catch(() => {
          // 실패해도 화면은 유지. name이 없으면 렌더에서 #id로 fallback
        })
        .finally(() => {
          inFlightRef.current.delete(id);
        });
    });
    // map이 업데이트될 때 need 계산이 바뀌어야 하므로 map을 deps에 포함
  }, [uniqueIds, map]);

  return map;
}
