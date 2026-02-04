import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanSearch, Columns, ArrowRightLeft, Eraser, FileText, ChevronRight } from 'lucide-react';
import Button from '../../components/Button/Button';

type DiffType = 'equal' | 'added' | 'removed' | 'modified';

interface DiffRow {
  originalLine: string | null;
  modifiedLine: string | null;
  type: DiffType;
}

interface WordDiff {
  value: string;
  type: 'equal' | 'added' | 'removed';
}

const computeWordDiff = (str1: string, str2: string) => {
  const words1 = str1.split(/(\s+)/);
  const words2 = str2.split(/(\s+)/);

  const diffs: { original: WordDiff[]; modified: WordDiff[] } = {
    original: [],
    modified: [],
  };

  let i = 0,
    j = 0;
  while (i < words1.length || j < words2.length) {
    if (i < words1.length && j < words2.length && words1[i] === words2[j]) {
      diffs.original.push({ value: words1[i], type: 'equal' });
      diffs.modified.push({ value: words2[j], type: 'equal' });
      i++;
      j++;
    } else {
      const nextMatchIn2 = words2.indexOf(words1[i], j + 1);
      const nextMatchIn1 = words1.indexOf(words2[j], i + 1);

      if (nextMatchIn2 !== -1 && nextMatchIn2 - j < 3) {
        while (j < nextMatchIn2) {
          diffs.modified.push({ value: words2[j], type: 'added' });
          j++;
        }
      } else if (nextMatchIn1 !== -1 && nextMatchIn1 - i < 3) {
        while (i < nextMatchIn1) {
          diffs.original.push({ value: words1[i], type: 'removed' });
          i++;
        }
      } else {
        if (i < words1.length) {
          diffs.original.push({ value: words1[i], type: 'removed' });
          i++;
        }
        if (j < words2.length) {
          diffs.modified.push({ value: words2[j], type: 'added' });
          j++;
        }
      }
    }
  }
  return diffs;
};

const computeLineDiff = (text1: string, text2: string): DiffRow[] => {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const result: DiffRow[] = [];

  let i = 0;
  let j = 0;

  while (i < lines1.length || j < lines2.length) {
    const l1 = lines1[i];
    const l2 = lines2[j];

    if (l1 === l2) {
      result.push({ originalLine: l1, modifiedLine: l2, type: 'equal' });
      i++;
      j++;
    } else {
      if (i < lines1.length && j < lines2.length && l1 !== l2) {
        const nextMatchIn2 = lines2.indexOf(l1, j + 1);
        const nextMatchIn1 = lines1.indexOf(l2, i + 1);

        if (
          nextMatchIn2 !== -1 &&
          nextMatchIn2 - j < (nextMatchIn1 !== -1 ? nextMatchIn1 - i : Infinity)
        ) {
          for (let k = j; k < nextMatchIn2; k++) {
            result.push({ originalLine: null, modifiedLine: lines2[k], type: 'added' });
          }
          j = nextMatchIn2;
        } else if (nextMatchIn1 !== -1) {
          for (let k = i; k < nextMatchIn1; k++) {
            result.push({ originalLine: lines1[k], modifiedLine: null, type: 'removed' });
          }
          i = nextMatchIn1;
        } else {
          result.push({ originalLine: l1, modifiedLine: l2, type: 'modified' });
          i++;
          j++;
        }
      } else if (i < lines1.length) {
        result.push({ originalLine: lines1[i], modifiedLine: null, type: 'removed' });
        i++;
      } else if (j < lines2.length) {
        result.push({ originalLine: null, modifiedLine: lines2[j], type: 'added' });
        j++;
      }
    }
  }
  return result;
};

const SmartDocComparatorPage = () => {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [diffRows, setDiffRows] = useState<DiffRow[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const handleCompare = () => {
    if (!originalText && !modifiedText) return;
    setIsComparing(true);

    setTimeout(() => {
      const result = computeLineDiff(originalText, modifiedText);
      setDiffRows(result);
      setIsComparing(false);
    }, 400);
  };

  const handleClear = () => {
    setOriginalText('');
    setModifiedText('');
    setDiffRows([]);
  };

  return (
    <div className="bg-pure-white min-h-screen min-w-7xl overflow-x-auto pt-32 pb-32 select-none">
      <div className="mx-auto w-300 px-6">
        <header className="border-point-blue mb-8 border-l-4 pl-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
          >
            Smart Document Comparator
          </motion.h1>
          <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
            두 문서를 비교하여 변경된 내용, 추가된 부분, 삭제된 내용을 정밀하게 분석합니다.
          </p>
        </header>

        <div className="flex h-150 flex-row gap-6">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-pure-white flex w-[320px] shrink-0 flex-col rounded-3xl border border-gray-100 p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-point-blue h-5 w-1.5 rounded-full" />
                <FileText size={20} className="text-midnight-ink" />
                <h2 className="text-midnight-ink text-lg font-black tracking-tight whitespace-nowrap uppercase">
                  입력 (Inputs)
                </h2>
              </div>
              <button
                onClick={handleClear}
                className="text-slate-gray hover:text-point-blue transition-colors"
                title="초기화"
              >
                <Eraser size={16} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-hidden">
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-midnight-ink ml-1 text-sm font-black whitespace-nowrap opacity-60">
                  원본 (ORIGINAL)
                </label>
                <textarea
                  className="bg-cloud-dancer/20 border-soft-pebble/30 focus:border-point-blue w-full flex-1 resize-none rounded-xl border p-3 text-sm leading-relaxed font-medium transition-all outline-none placeholder:text-slate-300"
                  placeholder="비교할 원본 내용을 입력하세요..."
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <label className="text-point-blue ml-1 text-sm font-black whitespace-nowrap opacity-80">
                  수정본 (MODIFIED)
                </label>
                <textarea
                  className="bg-point-blue/5 border-soft-pebble/30 focus:border-point-blue w-full flex-1 resize-none rounded-xl border p-3 text-sm leading-relaxed font-medium transition-all outline-none placeholder:text-slate-300"
                  placeholder="수정된 내용을 입력하세요..."
                  value={modifiedText}
                  onChange={(e) => setModifiedText(e.target.value)}
                />
              </div>

              <Button
                variant="blue"
                size="md"
                className="mt-1 flex items-center justify-center gap-2 rounded-xl py-3 text-base font-black whitespace-nowrap shadow-md"
                onClick={handleCompare}
                disabled={isComparing}
              >
                {isComparing ? (
                  <ArrowRightLeft size={18} className="animate-spin" />
                ) : (
                  <ScanSearch size={18} />
                )}
                {isComparing ? '분석 중...' : '비교 분석 실행'}
              </Button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-pure-white flex flex-1 flex-col overflow-hidden rounded-3xl border border-gray-100 shadow-lg"
          >
            <div className="border-b border-gray-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-point-blue h-5 w-1.5 rounded-full" />
                  <Columns size={20} className="text-midnight-ink" />
                  <h2 className="text-midnight-ink text-lg font-black tracking-tight whitespace-nowrap uppercase">
                    비교 결과 (Result)
                  </h2>
                </div>
                {diffRows.length > 0 && (
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1.5 rounded border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-600 uppercase">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 추가됨
                    </span>
                    <span className="flex items-center gap-1.5 rounded border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-600 uppercase">
                      <div className="h-1.5 w-1.5 rounded-full bg-rose-500" /> 삭제됨
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden bg-white">
              <div className="absolute inset-0 flex flex-col">
                <div className="z-10 flex border-b border-gray-200 bg-slate-50 text-sm font-black tracking-wider text-slate-500 uppercase">
                  <div className="flex w-1/2 items-center gap-2 border-r border-gray-200 p-3 pl-6">
                    원본 내용 (Original)
                  </div>
                  <div className="flex w-1/2 items-center gap-2 p-3 pl-6">
                    수정된 내용 (Modified)
                  </div>
                </div>

                <div className="custom-scrollbar flex-1 cursor-default overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {diffRows.length > 0 ? (
                      <div className="flex flex-col pb-10 font-mono text-sm leading-relaxed font-medium">
                        {diffRows.map((row, idx) => {
                          let wordDiffs = { original: [], modified: [] } as {
                            original: WordDiff[];
                            modified: WordDiff[];
                          };
                          if (row.type === 'modified' && row.originalLine && row.modifiedLine) {
                            wordDiffs = computeWordDiff(row.originalLine, row.modifiedLine);
                          }

                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.005 }}
                              className={`flex min-h-[2.2rem] transition-colors ${row.type === 'modified' ? 'bg-amber-50/20' : ''}`}
                            >
                              <div
                                className={`relative flex w-1/2 items-center border-r border-gray-100 px-6 py-1.5 break-all ${row.type === 'removed' ? 'bg-rose-50/60 text-rose-900' : 'text-slate-600'} `}
                              >
                                {row.type === 'added' ? (
                                  <div className="absolute inset-0 bg-slate-400 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-[0.03]" />
                                ) : row.type === 'modified' ? (
                                  <span>
                                    {wordDiffs.original.map((word, wIdx) => (
                                      <span
                                        key={wIdx}
                                        className={
                                          word.type === 'removed'
                                            ? 'mx-0.5 rounded bg-rose-100 px-0.5 text-rose-800 line-through decoration-rose-400 decoration-2'
                                            : ''
                                        }
                                      >
                                        {word.value}
                                      </span>
                                    ))}
                                  </span>
                                ) : (
                                  row.originalLine
                                )}
                              </div>

                              <div
                                className={`relative flex w-1/2 items-center px-6 py-1.5 break-all ${row.type === 'added' ? 'bg-emerald-50/60 text-emerald-900' : 'text-slate-600'} `}
                              >
                                {row.type === 'removed' ? (
                                  <div className="absolute inset-0 bg-slate-400 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-[0.03]" />
                                ) : row.type === 'modified' ? (
                                  <span>
                                    {wordDiffs.modified.map((word, wIdx) => (
                                      <span
                                        key={wIdx}
                                        className={
                                          word.type === 'added'
                                            ? 'mx-0.5 rounded border-b-2 border-emerald-200 bg-emerald-100 px-0.5 font-bold text-emerald-800'
                                            : ''
                                        }
                                      >
                                        {word.value}
                                      </span>
                                    ))}
                                  </span>
                                ) : (
                                  row.modifiedLine
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center opacity-20 select-none">
                        <div className="mb-6 flex gap-8">
                          <div className="border-midnight-ink flex h-40 w-32 items-center justify-center rounded-xl border-2 border-dashed bg-slate-50">
                            <span className="text-2xl font-black text-slate-400">A</span>
                          </div>
                          <ChevronRight size={32} className="self-center text-slate-400" />
                          <div className="border-midnight-ink flex h-40 w-32 items-center justify-center rounded-xl border-2 border-dashed bg-slate-50">
                            <span className="text-2xl font-black text-slate-400">B</span>
                          </div>
                        </div>
                        <p className="text-center text-lg leading-relaxed font-bold whitespace-nowrap text-slate-500 italic">
                          텍스트를 입력하고 분석 버튼을 누르면
                          <br />
                          차이점이 이곳에 표시됩니다.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default SmartDocComparatorPage;
