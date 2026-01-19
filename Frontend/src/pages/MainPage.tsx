function MainPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 pt-20">
      <h2 className="text-midnight-ink mb-6 text-3xl font-bold">추천 공고</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 공고 카드들이 들어갈 자리 */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-pure-white border-soft-pebble rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="bg-cloud-dancer mb-4 h-40 rounded-xl" />
            <div className="mb-2 text-lg font-bold">프론트엔드 개발자 채용</div>
            <div className="text-slate-gray text-sm">Portmatch Corp. | 서울</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MainPage;
