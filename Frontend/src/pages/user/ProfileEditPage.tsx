// src/pages/user/ProfileEditPage.tsx
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
import { useAuthStore } from '@/store/authStore';

type Gender = '' | 'MALE' | 'FEMALE' | 'NONE';

type FormState = {
  name: string;
  email: string;
  phone: string;

  gender: Gender;
  birthDate: string; // YYYY-MM-DD
  address: string;
  totalExperienceYears: string; // 숫자지만 입력 편하게 문자열

  // ✅ 비밀번호 변경
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const STORAGE_KEY = 'applicant_profile_extra_v1';

function formatPhoneNumber(val: string) {
  const num = val.replace(/[^0-9]/g, '');
  if (num.length <= 3) return num;
  if (num.length <= 7) return `${num.slice(0, 3)}-${num.slice(3)}`;
  return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7, 11)}`;
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// 영문+숫자 포함, 8~64 (백엔드 정책 나오면 그걸로 맞추면 됨)
function isValidPassword(v: string) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(v);
}

function isPastDate(ymd: string) {
  if (!ymd) return true;
  const t = new Date(ymd).getTime();
  if (Number.isNaN(t)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return t < today.getTime();
}

function safeLoadExtra() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<FormState>;
  } catch {
    return null;
  }
}

function safeSaveExtra(form: FormState) {
  // ✅ 비번 관련은 저장 금지
  const payload: Partial<FormState> = {
    gender: form.gender,
    birthDate: form.birthDate,
    phone: form.phone.replace(/-/g, ''),
    address: form.address,
    totalExperienceYears: form.totalExperienceYears,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();

  // ✅ 에러 스크롤용 refs
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [toast, setToast] = useState<{ message: ReactNode; visible: boolean }>({
    message: '',
    visible: false,
  });

  const showToastMessage = (msg: ReactNode) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2500);
  };

  const initial = useMemo<FormState>(() => {
    const extra = safeLoadExtra();

    return {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: extra?.phone ? formatPhoneNumber(String(extra.phone)) : '',

      gender: (extra?.gender as Gender) ?? '',
      birthDate: extra?.birthDate ?? '',
      address: extra?.address ?? '',
      totalExperienceYears:
        extra?.totalExperienceYears !== undefined && extra?.totalExperienceYears !== null
          ? String(extra.totalExperienceYears)
          : '',

      currentPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    };
  }, [user?.email, user?.name]);

  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    // ✅ 회사 계정이 여기 오면 회사 프로필 수정으로 보내버림
    if (user?.role === 'COMPANY') navigate('/company/profile/edit', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const scrollToFirstError = (e: FormErrors) => {
    const order: (keyof FormState)[] = [
      'name',
      'email',
      'phone',
      'birthDate',
      'totalExperienceYears',
      'currentPassword',
      'newPassword',
      'newPasswordConfirm',
    ];
    const first = order.find((k) => e[k]);
    if (!first) return;

    fieldRefs.current[String(first)]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = fieldRefs.current[String(first)]?.querySelector(
      'input, select',
    ) as HTMLElement | null;
    input?.focus?.();
  };

  const validateProfile = (next: FormState) => {
    const e: FormErrors = {};
    if (!next.name.trim()) e.name = '이름은 필수입니다.';
    if (!next.email.trim()) e.email = '이메일은 필수입니다.';
    else if (!isValidEmail(next.email)) e.email = '이메일 형식이 올바르지 않습니다.';

    if (!next.phone.trim()) e.phone = '전화번호는 필수입니다.';
    else {
      const digits = next.phone.replace(/[^0-9]/g, '');
      if (digits.length < 10 || digits.length > 11) e.phone = '전화번호 형식이 올바르지 않습니다.';
    }

    if (next.birthDate && !isPastDate(next.birthDate)) {
      e.birthDate = '생년월일은 과거 날짜여야 합니다.';
    }

    if (next.totalExperienceYears.trim()) {
      const n = Number(next.totalExperienceYears);
      if (!Number.isFinite(n) || n < 0) e.totalExperienceYears = '0 이상의 숫자만 입력해주세요.';
    }

    return e;
  };

  const validatePasswordChange = (next: FormState) => {
    const e: FormErrors = {};

    const wantsChange =
      !!next.currentPassword.trim() ||
      !!next.newPassword.trim() ||
      !!next.newPasswordConfirm.trim();

    if (!wantsChange) return e;

    if (!next.currentPassword.trim()) e.currentPassword = '현재 비밀번호를 입력해주세요.';
    if (!next.newPassword.trim()) e.newPassword = '새 비밀번호를 입력해주세요.';
    else if (!isValidPassword(next.newPassword.trim()))
      e.newPassword = '새 비밀번호는 8~64자, 영문+숫자를 포함해야 합니다.';

    if (!next.newPasswordConfirm.trim()) e.newPasswordConfirm = '새 비밀번호 확인을 입력해주세요.';
    else if (next.newPasswordConfirm !== next.newPassword)
      e.newPasswordConfirm = '새 비밀번호와 일치하지 않습니다.';

    if (
      next.currentPassword.trim() &&
      next.newPassword.trim() &&
      next.currentPassword === next.newPassword
    ) {
      e.newPassword = '현재 비밀번호와 다른 비밀번호로 설정해주세요.';
    }

    return e;
  };

  const onChange = (key: keyof FormState, value: string) => {
    let v = value;

    if (key === 'phone') v = formatPhoneNumber(value);
    if (key === 'totalExperienceYears') v = value.replace(/[^0-9]/g, '');

    const next = { ...form, [key]: v };
    setForm(next);

    // ✅ 입력하면서 에러 정리(너무 빡세게 실시간 검증은 안 함)
    setErrors((prev) => ({ ...prev, ...validateProfile(next), ...validatePasswordChange(next) }));
  };

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProfile) return;

    const profileErrors = validateProfile(form);
    setErrors((prev) => ({ ...prev, ...profileErrors }));

    if (Object.values(profileErrors).some(Boolean)) {
      scrollToFirstError(profileErrors);
      return;
    }

    setIsSavingProfile(true);
    try {
      // ✅ 프로필은 데모로 로컬 저장 + authStore(name/email)만 업데이트
      safeSaveExtra(form);

      if (user) {
        setAuth({
          ...user,
          name: form.name.trim(),
          email: form.email.trim(),
        });
      }

      showToastMessage('저장 완료! (추가 정보는 로컬 저장)');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onChangePassword = async () => {
    if (isChangingPw) return;

    const pwErrors = validatePasswordChange(form);
    setErrors((prev) => ({ ...prev, ...pwErrors }));

    if (Object.values(pwErrors).some(Boolean)) {
      scrollToFirstError(pwErrors);
      return;
    }

    // ✅ 여기서 API 연결하면 됨:
    // await accountApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });

    setIsChangingPw(true);
    try {
      showToastMessage('비밀번호 변경: 아직 API 연동 전이라 실제 변경은 안 돼요 😅');
      setForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        newPasswordConfirm: '',
      }));
    } finally {
      setIsChangingPw(false);
    }
  };

  return (
    <div className="bg-pure-white text-midnight-ink min-h-screen min-w-[980px] overflow-x-auto pt-28 pb-20">
      <div className="mx-auto w-[980px] px-6">
        {/* 헤더 */}
        <header className="overflow-hidden rounded-4xl border border-zinc-100 bg-zinc-50 shadow-sm">
          <div className="relative p-10">
            <div className="absolute inset-0 bg-linear-to-r from-zinc-50 via-zinc-50/70 to-transparent" />
            <div className="relative flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black tracking-[0.3em] text-zinc-400 uppercase">
                  ACCOUNT SETTINGS
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tighter">회원 정보 수정</h1>
                <p className="mt-2 text-sm font-semibold text-zinc-500">
                  비밀번호는 아래 섹션에서 “현재 비번 + 새 비번 2회”로 바꿔요.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" size="md" className="bg-pure-white rounded-2xl" isBack>
                  뒤로
                </Button>
              </div>
            </div>
          </div>
        </header>

        <form onSubmit={onSaveProfile} className="mt-8 space-y-6">
          {/* 기본 정보 */}
          <section className="rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black tracking-tighter">기본 정보</h2>

            <div className="mt-6 grid grid-cols-2 gap-5">
              <div
                ref={(el) => {
                  fieldRefs.current.name = el;
                }}
              >
                <Input
                  id="name"
                  label="이름 *"
                  value={form.name}
                  onChange={(ev) => onChange('name', ev.target.value)}
                  error={errors.name}
                />
              </div>

              <div
                ref={(el) => {
                  fieldRefs.current.email = el;
                }}
              >
                <Input
                  id="email"
                  label="이메일 *"
                  value={form.email}
                  onChange={(ev) => onChange('email', ev.target.value)}
                  error={errors.email}
                />
              </div>

              <div
                ref={(el) => {
                  fieldRefs.current.phone = el;
                }}
              >
                <Input
                  id="phone"
                  label="전화번호 *"
                  placeholder="010-1234-5678"
                  value={form.phone}
                  onChange={(ev) => onChange('phone', ev.target.value)}
                  error={errors.phone}
                />
              </div>

              <div className="flex items-end">
                <p className="text-xs font-semibold text-zinc-500">
                  ※ 이메일 변경 허용 여부는 백엔드 정책에 따라 달라질 수 있어요.
                </p>
              </div>
            </div>
          </section>

          {/* 추가 정보 */}
          <section className="rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black tracking-tighter">추가 정보</h2>

            <div className="mt-6 grid grid-cols-2 gap-5">
              <div>
                <Select
                  id="gender"
                  label="성별"
                  value={form.gender}
                  onChange={(ev) => onChange('gender', ev.target.value)}
                  options={[
                    { value: '', label: '선택' },
                    { value: 'MALE', label: '남성 (MALE)' },
                    { value: 'FEMALE', label: '여성 (FEMALE)' },
                    { value: 'NONE', label: '선택 안 함 (NONE)' },
                  ]}
                />
              </div>

              <div
                ref={(el) => {
                  fieldRefs.current.birthDate = el;
                }}
              >
                <Input
                  id="birthDate"
                  type="date"
                  label="생년월일"
                  value={form.birthDate}
                  onChange={(ev) => onChange('birthDate', ev.target.value)}
                  error={errors.birthDate}
                />
              </div>

              <div className="col-span-2">
                <Input
                  id="address"
                  label="주소"
                  placeholder="예) 서울 강남구 ..."
                  value={form.address}
                  onChange={(ev) => onChange('address', ev.target.value)}
                />
              </div>

              <div
                ref={(el) => {
                  fieldRefs.current.totalExperienceYears = el;
                }}
              >
                <Input
                  id="totalExperienceYears"
                  type="number"
                  min={0}
                  label="총 경력 연차"
                  placeholder="예) 0"
                  value={form.totalExperienceYears}
                  onChange={(ev) => onChange('totalExperienceYears', ev.target.value)}
                  error={errors.totalExperienceYears}
                />
              </div>

              <div className="flex items-end">
                <p className="text-xs font-semibold text-zinc-500">
                  ※ 추가 정보는 현재 데모로 로컬에만 저장돼요.
                </p>
              </div>
            </div>
          </section>

          {/* 비밀번호 변경 */}
          <section className="rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tighter">비밀번호 변경</h2>
                <p className="mt-2 text-sm font-semibold text-zinc-500">
                  현재 비밀번호로 확인 후 새 비밀번호를 2번 입력해요.
                </p>
              </div>

              <Button
                type="button"
                variant="blue"
                size="md"
                className="rounded-2xl"
                onClick={onChangePassword}
                disabled={isChangingPw}
              >
                {isChangingPw ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-5">
              <div
                className="col-span-2"
                ref={(el) => {
                  fieldRefs.current.currentPassword = el;
                }}
              >
                <Input
                  id="currentPassword"
                  type="password"
                  label="현재 비밀번호 *"
                  value={form.currentPassword}
                  onChange={(ev) => onChange('currentPassword', ev.target.value)}
                  error={errors.currentPassword}
                />
              </div>

              <div
                ref={(el) => {
                  fieldRefs.current.newPassword = el;
                }}
              >
                <Input
                  id="newPassword"
                  type="password"
                  label="새 비밀번호 *"
                  placeholder="영문+숫자 포함 8~64자"
                  value={form.newPassword}
                  onChange={(ev) => onChange('newPassword', ev.target.value)}
                  error={errors.newPassword}
                />
              </div>

              <div
                ref={(el) => {
                  fieldRefs.current.newPasswordConfirm = el;
                }}
              >
                <Input
                  id="newPasswordConfirm"
                  type="password"
                  label="새 비밀번호 확인 *"
                  value={form.newPasswordConfirm}
                  onChange={(ev) => onChange('newPasswordConfirm', ev.target.value)}
                  error={errors.newPasswordConfirm}
                />
              </div>
            </div>
          </section>

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="rounded-2xl"
              onClick={() => navigate('/mypage')}
              disabled={isSavingProfile}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="blue"
              size="md"
              className="rounded-2xl"
              disabled={isSavingProfile}
            >
              {isSavingProfile ? '저장 중...' : '프로필 저장'}
            </Button>
          </div>
        </form>

        {/* ✅ 토스트 (프로젝트 패턴 그대로) */}
        <AnimatePresence>
          {toast.visible && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className="bg-midnight-ink text-pure-white fixed bottom-10 left-1/2 z-[100] rounded-2xl px-6 py-3 text-center text-sm font-bold whitespace-nowrap shadow-2xl"
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
