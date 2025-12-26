import React from "react";
import { PATTERNS } from "./question.jsx";
import { useNavigate } from "react-router-dom";

// App.jsx 内（どこでもOK）に追加
function Home({ initialPatternId, initialCount, onStart }) {
  const [query, setQuery] = React.useState("");
  const [count, setCount] = React.useState(Number.isFinite(initialCount) ? initialCount : 10);
  const navigate = useNavigate();

  // フィルタ（id に "ante"/"chase" が含まれるか）
  const [onlyAnte, setOnlyAnte] = React.useState(false);
  const [onlyChase, setOnlyChase] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    return (PATTERNS || [])
      .filter((p) => {
        if (onlyAnte && !String(p.id).toLowerCase().includes("ante")) return false;
        if (onlyChase && !String(p.id).toLowerCase().includes("chase")) return false;
        if (!q) return true;contentReference

        const hay = `${p.id} ${p.label}`.toLowerCase();
        return hay.includes(q);
      });
  }, [query, onlyAnte, onlyChase]);

  const [selectedId, setSelectedId] = React.useState(initialPatternId ?? (PATTERNS?.[0]?.id ?? ""));
  const selected = React.useMemo(
    () => (PATTERNS || []).find((p) => p.id === selectedId) || null,
    [selectedId]
  );

  // 初期選択がフィルタで消えた時に、先頭へ寄せる
  React.useEffect(() => {
    if (!filtered.length) return;
    if (!filtered.some((p) => p.id === selectedId)) setSelectedId(filtered[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.map((p) => p.id).join("|")]);

  return (
    <div style={ui.wrap}>
      {/* ヘッダ */}
      <div style={ui.header}>
        <div>
          <div style={ui.title}>問題選択</div>
          <div style={ui.subtitle}>
            PATTERNS から出題パターンを選択して開始します
          </div>
        </div>

        <button
          style={ui.primaryBtn}
          disabled={!selectedId}
          onClick={() => onStart?.({ patternId: selectedId, count })}
        >
          選択中で開始
        </button>
      </div>

      {/* 検索・フィルタ・問題数 */}
      <div style={ui.controls}>
        <input
          style={ui.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="検索（例: BTN / 50bb / SB vs BTN / chase / ante）"
        />

        <label style={ui.chk}>
          <input
            type="checkbox"
            checked={onlyAnte}
            onChange={(e) => setOnlyAnte(e.target.checked)}
          />
          <span>ante のみ</span>
        </label>

        <label style={ui.chk}>
          <input
            type="checkbox"
            checked={onlyChase}
            onChange={(e) => setOnlyChase(e.target.checked)}
          />
          <span>chase のみ</span>
        </label>

        <div style={ui.countBox}>
          <div style={ui.countLabel}>問題数</div>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Number(e.target.value || 10))}
            style={ui.countInput}
          />
        </div>

        <div style={ui.meta}>
          表示: <b>{filtered.length}</b> 件 / 全 <b>{PATTERNS?.length ?? 0}</b> 件
        </div>
      </div>

      {/* 2カラム：左=一覧、右=詳細 */}
      <div style={ui.grid}>
        {/* 一覧 */}
        <div style={ui.list}>
          {filtered.length === 0 ? (
            <div style={ui.empty}>
              条件に一致するパターンがありません。検索/フィルタを変更してください。
            </div>
          ) : (
            filtered.map((p) => {
              const active = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  style={{
                    ...ui.cardBtn,
                    ...(active ? ui.cardBtnActive : null),
                  }}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div style={ui.cardTop}>
                    <div style={ui.cardTitle}>{p.label}</div>
                    <div style={ui.badges}>
                      {String(p.id).toLowerCase().includes("ante") && (
                        <span style={ui.badge}>ante</span>
                      )}
                      {String(p.id).toLowerCase().includes("chase") && (
                        <span style={ui.badge}>chase</span>
                      )}
                    </div>
                  </div>
                  <div style={ui.cardId}>{p.id}</div>
                </button>
              );
            })
          )}
        </div>

        {/* 詳細 */}
        <div style={ui.detail}>
          {selected ? (
            <>
              <div style={ui.detailHeader}>
                <div>
                  <div style={ui.detailTitle}>{selected.label}</div>
                  <div style={ui.detailId}>{selected.id}</div>
                </div>
                <button
                  style={ui.primaryBtn}
                  disabled={!selectedId}
                  onClick={() => {
                    navigate("/quiz", { state: { patternId: selectedId, count } });
                  }}
                >

                  このパターンで開始
                </button>
              </div>

              <div style={ui.detailBody}>
                <div style={ui.kv}>
                  <div style={ui.k}>問題数</div>
                  <div style={ui.v}>{count}</div>
                </div>

                {/* ここは軽い説明。questionBuilder があれば雰囲気も出せる */}
                <div style={ui.kv}>
                  <div style={ui.k}>questionBuilder</div>
                  <div style={ui.v}>
                    {typeof selected.questionBuilder === "function"
                      ? "あり"
                      : "なし"}
                  </div>
                </div>

                <div style={ui.kv}>
                  <div style={ui.k}>options / bands</div>
                  <div style={ui.v}>
                    {Array.isArray(selected.bands) ? `${selected.bands.length} bands` : "—"}
                  </div>
                </div>

                <div style={ui.note}>
                  ※ PATTERNS の内容（id/label/questionBuilder 等）に基づいて出題が行われます。{" "}
                  {/* PATTERNS が id/label を持つ根拠 */}
                  <span style={{ opacity: 0.9 }}>
                    {/* （PATTERNS は id/label を保持 :contentReference[oaicite:1]{index=1}） */}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div style={ui.empty}>左の一覧からパターンを選択してください。</div>
          )}
        </div>
      </div>
    </div>// src/Home.jsx
  );
}

// Home 用の最小スタイル（App.jsx 内でOK）
const ui = {
  wrap: { maxWidth: 1100, margin: "0 auto", padding: 16 },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: 800 },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },

  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff",
    marginBottom: 12,
  },
  search: {
    flex: "1 1 360px",
    minWidth: 260,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    outline: "none",
  },
  chk: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" },
  countBox: { display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" },
  countLabel: { fontSize: 12, color: "#6b7280" },
  countInput: {
    width: 84,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
  },
  meta: { fontSize: 12, color: "#6b7280" },

  grid: { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 },
  list: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff",
    padding: 8,
    maxHeight: "calc(100vh - 220px)",
    overflow: "auto",
  },
  detail: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff",
    padding: 12,
    minHeight: 240,
  },
  empty: { padding: 16, color: "#6b7280", fontSize: 13 },

  cardBtn: {
    width: "100%",
    textAlign: "left",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #f3f4f6",
    background: "#fff",
    cursor: "pointer",
    marginBottom: 8,
  },
  cardBtnActive: { borderColor: "#111827", boxShadow: "0 0 0 2px rgba(17,24,39,0.10)" },
  cardTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontWeight: 700, fontSize: 14, color: "#111827" },
  cardId: { fontSize: 12, color: "#6b7280", marginTop: 6 },
  badges: { display: "flex", gap: 6, flexWrap: "wrap" },
  badge: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    color: "#374151",
    background: "#f9fafb",
  },

  detailHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  detailTitle: { fontSize: 16, fontWeight: 800 },
  detailId: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  detailBody: { marginTop: 12, display: "grid", gap: 10 },
  kv: { display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, alignItems: "center" },
  k: { fontSize: 12, color: "#6b7280" },
  v: { fontSize: 13, color: "#111827" },
  note: { marginTop: 8, fontSize: 12, color: "#6b7280", lineHeight: 1.5 },

  primaryBtn: {
    border: "none",
    borderRadius: 12,
    padding: "10px 14px",
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};

export default Home;