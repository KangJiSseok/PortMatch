import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Checkbox from '../../components/Checkbox/Checkbox';
import Select from '../../components/Select/Select';
import FileUploader from '../../components/FileUploader/FileUploader';

function DesignSystemPage() {
  const jobOptions = [
    { value: 'fe', label: '프론트엔드 엔지니어' },
    { value: 'be', label: '백엔드 엔지니어' },
    { value: 'de', label: '프로덕트 디자이너' },
  ];

  return (
    <div className="bg-pure-white min-h-screen min-w-5xl pt-20 pb-20">
      <main className="mx-auto w-5xl space-y-12 px-10">
        <header className="border-soft-pebble border-b pb-8">
          <h1 className="text-midnight-ink text-5xl font-black tracking-tighter whitespace-nowrap uppercase">
            Unified Design System
          </h1>
          <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap">
            PORTMATCH 공통 UI 컴포넌트 라이브러리
          </p>
        </header>

        <section className="bg-pure-white border-soft-pebble/30 overflow-hidden rounded-4xl border shadow-sm">
          <div className="bg-cloud-dancer border-soft-pebble/30 border-b p-6">
            <h2 className="text-midnight-ink text-2xl font-black whitespace-nowrap uppercase">
              1. Button System
            </h2>
          </div>
          <div className="space-y-10 p-10">
            <div>
              <h3 className="text-slate-gray mb-6 text-sm font-black tracking-widest uppercase opacity-60">
                Variants
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="light">Light</Button>
                <Button variant="dark">Dark</Button>
                <Button variant="blue">Blue Action</Button>
                <Button variant="red">Alert Red</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline" colorTheme="light">
                  Outline
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-slate-gray mb-6 text-sm font-black tracking-widest uppercase opacity-60">
                Back Navigation
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button isBack variant="outline" />
              </div>
            </div>

            <div>
              <h3 className="text-slate-gray mb-6 text-sm font-black tracking-widest uppercase opacity-60">
                Sizes & Special
              </h3>
              <div className="flex flex-wrap items-end gap-6">
                <Button size="sm" variant="blue">
                  Small
                </Button>
                <Button size="md" variant="blue">
                  Medium
                </Button>
                <Button size="lg" variant="blue">
                  Large
                </Button>
                <Button size="xl" variant="blue">
                  Extra Large
                </Button>
                <div className="border-soft-pebble flex items-center gap-3 border-l pl-6">
                  <Button variant="close" size="sm" />
                  <Button variant="close" size="md" />
                  <Button variant="close" size="lg" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-10">
          <section className="bg-pure-white border-soft-pebble/30 overflow-hidden rounded-4xl border shadow-sm">
            <div className="bg-cloud-dancer border-soft-pebble/30 border-b p-6">
              <h2 className="text-midnight-ink flex items-center gap-3 text-xl font-black whitespace-nowrap uppercase">
                <span className="bg-pure-white flex h-8 w-8 items-center justify-center rounded-lg text-sm shadow-sm">
                  L
                </span>
                Light Theme Components
              </h2>
            </div>
            <div className="space-y-8 p-10">
              <Input label="사용자 이름" placeholder="성함을 입력하세요" variant="light" />
              <Select label="희망 직무" options={jobOptions} variant="light" />
              <div className="flex flex-wrap gap-6">
                <Checkbox label="약관 동의" variant="light" />
                <Checkbox label="마케팅 수신" variant="light" checked />
              </div>
              <FileUploader label="이력서 첨부 (PDF)" variant="light" />
              <div className="flex gap-3 pt-4">
                <Button variant="blue" className="flex-1">
                  등록하기
                </Button>
                <Button variant="outline" colorTheme="light" className="flex-1">
                  취소
                </Button>
              </div>
            </div>
          </section>

          <section className="bg-midnight-ink border-slate-gray/30 overflow-hidden rounded-4xl border shadow-xl">
            <div className="bg-slate-gray border-slate-gray/50 text-pure-white border-b p-6">
              <h2 className="flex items-center gap-3 text-xl font-black whitespace-nowrap uppercase">
                <span className="bg-midnight-ink text-pure-white border-slate-gray flex h-8 w-8 items-center justify-center rounded-lg border text-sm shadow-sm">
                  D
                </span>
                Dark Theme Components
              </h2>
            </div>
            <div className="space-y-8 p-10">
              <Input label="Email Address" placeholder="Enter your email" variant="dark" />
              <Select label="Position Category" options={jobOptions} variant="dark" />
              <div className="flex flex-wrap gap-6">
                <Checkbox label="Keep me logged in" variant="dark" checked />
                <Checkbox label="Dark mode enable" variant="dark" />
              </div>
              <FileUploader label="Upload Portfolio" variant="dark" />
              <div className="flex gap-3 pt-4">
                <Button variant="light" className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" colorTheme="dark" className="flex-1">
                  Discard
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default DesignSystemPage;
