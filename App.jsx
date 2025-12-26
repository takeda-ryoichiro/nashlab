import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";useNavigate
import { PATTERNS } from "./question.jsx";

/**
 * Preflop Quiz – Pattern + RangeSpec answer
 * - 6-max テーブル可視化（全員スタックBB表示）
 * - SB/BB はブラインド支払いをチップ表示で可視化
 * - 出題ハンドはランダム（デフォルト10問セット）
 * - PATTERNSの回答は「action + range(HAND_RANGE_SPEC形式)」で定義
 * - Enter: 回答/次へ、R: 新しいセット作成
 */

/* ================= 基本 ================= */
const POSITIONS6 = ["UTG", "MP", "CO", "BTN", "SB", "BB"];
const POSITIONS9 = ["UTG", "+1", "+2", "LJ", "MP", "CO", "BTN", "SB", "BB"];
const BLIND_SIZES = { SB: 0.5, BB: 1 };

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const RANK_INDEX = Object.fromEntries(RANKS.map((r, i) => [r, i]));


// POT計算
const NUM_PLAYERS = 6;

function calcBasePotBB() {
  return BLIND_SIZES.SB + BLIND_SIZES.BB; // 0.5 + 1 = 1.5
}

function calcExtraPotByPatternId(patternId, facing) {
  const id = String(patternId || "");
  const facingSize = String(facing || "");
  console.log(facingSize);
  const lower = id.toLowerCase();

  let extra = 0;

  // "chase" を含む場合：1人につき0.25BB
  if (lower.includes("chase")) {
    extra += 0.25 * NUM_PLAYERS; // 1.5
  }

  // "Ante" を含む場合：+1BB（合計）
  if (lower.includes("ante")) {
    extra += 1.0;
  }

  // facing openスタックを追加する
  if(facingSize.split(" ")[1] && facingSize.split(" ")[1].includes("open")){
    // facing: "UTG open 2.3x",
    let size = Number(facingSize.split(" ")[2].replace("x",""));
    extra += size;
  }

  return extra;
}

function calcTotalPotBB(patternId, facing) {
  return calcBasePotBB() + calcExtraPotByPatternId(patternId, facing);
}

/**
 * 例: AA:0.991, 88-77, AQo-AJo, KJs:0.262 ...
 * - weight省略は1.0として扱う
 * - "AQo-AJo" のように weightが無い場合も含められる（=1.0）
 */
function expandPairRange(token) {
  const m = token.match(/^([2-9TJQKA])\1(?:-([2-9TJQKA])\2)?$/i);
  console.log(m)
  if (!m) return [];
  const start = m[1].toUpperCase();
  const end = (m[2] || m[1]).toUpperCase();
  const s = RANK_INDEX[start];
  const e = RANK_INDEX[end];
  if (s == null || e == null) return [];
  const out = [];
  for (let i = Math.min(s, e); i <= Math.max(s, e); i++) out.push(RANKS[i] + RANKS[i]);
  console.log(out)
  return out;
}

function expandNonPairRange(token) {
  // AKs / AQo-AJo など（先頭ランク固定）
  const m = token.match(/^([2-9TJQKA])([2-9TJQKA])([so])(?:-([2-9TJQKA])([2-9TJQKA])\3)?$/i);
  if (!m) return [];
  const a = m[1].toUpperCase();
  const b = m[2].toUpperCase();
  const sfx = m[3].toLowerCase();
  const a2 = (m[4] || a).toUpperCase();
  const b2 = (m[5] || b).toUpperCase();
  if (a !== a2) return [];
  const s = RANK_INDEX[b];
  const e = RANK_INDEX[b2];
  if (s == null || e == null) return [];
  const out = [];
  for (let i = Math.min(s, e); i <= Math.max(s, e); i++) out.push(a + RANKS[i] + sfx);
  return out;
}

function expandPlusRange(token) {
  // 66+
  let m = token.match(/^([2-9TJQKA])\1\+$/i);
  if (m) {
    const start = m[1].toUpperCase();
    const s = RANK_INDEX[start];
    if (s == null) return [];
    // A,K,Q,...,2 の順なので「start(例:6)より強いペア」を含めるには index を 0..s
    return RANKS.slice(0, s + 1).map((r) => r + r);
  }

  // A5s+ / KTo+（上側ランク固定で、下側を強い方（=index小）へ伸ばす）
  // 例: A5s+ => A5s,A6s,...,AKs（AAsは除外）
  m = token.match(/^([2-9TJQKA])([2-9TJQKA])([so])\+$/i);
  if (!m) return [];

  const hi = m[1].toUpperCase(); // 例: A
  const lo = m[2].toUpperCase(); // 例: 5
  const sfx = m[3].toLowerCase();

  const hiIdx = RANK_INDEX[hi];
  const loIdx = RANK_INDEX[lo];
  if (hiIdx == null || loIdx == null) return [];

  // hi は常に lo より強い必要がある（A5 はOK, 55o みたいなのは弾く）
  if (loIdx <= hiIdx) return [];

  const out = [];
  // loIdx(弱い) -> hiIdx+1(強い側) へ indexを下げていく
  // 例: loIdx=9(5), hiIdx=0(A) => i=9..1 を作る => 5,6,7,8,9,T,J,Q,K
  for (let i = loIdx; i >= hiIdx + 1; i--) {
    out.push(hi + RANKS[i] + sfx);
  }
  return out;
}

function parseRangeSpec(spec) {
  const items = (spec || "").split(/\s*,\s*/).filter(Boolean);
  const map = new Map(); // hand -> weight

  for (const raw of items) {
    const [handPartRaw, weightPartRaw] = raw.split(":");
    const handPart = (handPartRaw || "").trim();
    const weightPart = weightPartRaw != null ? String(weightPartRaw).trim() : null;
    console.log(raw)
    console.log(handPartRaw)
    console.log(weightPartRaw)
    console.log(handPart)

    if (!handPart) continue;

    let hands = [];

    if (handPart.endsWith("+")) {
      hands = expandPlusRange(handPart);
      if (!hands.length) continue; // パース不能なら捨てる
    }
    // ペア（66, 88-77）
    else if (/^[2-9TJQKA]\1(?:-([2-9TJQKA])\2)?$/i.test(handPart)) {
      hands = expandPairRange(handPart);
    }
    // non-pair range（AQo-AJo など）※先頭ランク固定
    else if (/^([2-9TJQKA])([2-9TJQKA])([so])(?:-\1([2-9TJQKA])\3)?$/i.test(handPart)) {
      hands = expandNonPairRange(handPart);
    }
    // 単体 non-pair
    else if (/^[2-9TJQKA][2-9TJQKA][so]$/i.test(handPart)) {
      hands = [handPart.toUpperCase()];
    } 
    // 単体ペア
    else if (/^[2-9TJQKA][2-9TJQKA]$/i.test(handPart)) {
      hands = [handPart.toUpperCase()];
    }
    else {
      continue;
    }

    console.log(hands);

    const w = weightPart == null || weightPart === "" ? 1.0 : Number(weightPart);
    const weight = Number.isFinite(w) ? w : 1.0;

    for (const h of hands) map.set(h.toUpperCase(), weight);
  }

  console.log(map)

  return map;
}

/* range文字列 -> Map をキャッシュ（毎回parseしない） */
const __rangeCache = new Map();
function getRangeMap(rangeStr) {
  const key = (rangeStr || "").replace(/\s+/g, " ").trim();
  console.log(key);
  if (!key) return new Map();
  if (__rangeCache.has(key)) return __rangeCache.get(key);
  const m = parseRangeSpec(key);
  console.log(m)
  __rangeCache.set(key, m);
  return m;
}

/** optionsの先頭単語で action を探す（open/call/3bet/jam/fold など） */
function findIndexByAction(options, action) {
  const target = actionKeyFromBand(action);
  if (!target) return 0;

  const opts = (options || []).map(o => actionKeyFromOption(o));

  // まずは完全一致（"3bet 10bb" などを正確に拾う）
  let idx = opts.findIndex(k => k === target);
  if (idx !== -1) return idx;

  // 次に「先頭単語一致」をフォールバック（"open" と "open 2.2bb" の互換用）
  const head = target.split(/\s+/)[0];
  idx = opts.findIndex(k => k.split(/\s+/)[0] === head);
  return idx !== -1 ? idx : 0;
}


/* ========= 全169ハンド生成 ========= */
function allHands169() {
  const out = [];
  // ペア 13
  for (const r of RANKS) out.push(r + r);
  // スーテッド 78 & オフスート 78（常に高位→低位の順）
  for (let i = 0; i < RANKS.length; i++) {
    for (let j = i + 1; j < RANKS.length; j++) {
      out.push(RANKS[i] + RANKS[j] + "s");
      out.push(RANKS[i] + RANKS[j] + "o");
    }
  }
  return out;
}

const ALL_HANDS = allHands169();

/**
 * bands = [{action, range, min?}, ...]
 * - 上から順に「rangeにhandが含まれ、weight>=min（省略時defaultMin）」のものを採用
 * - どれにも当たらなければ fallbackAction
 */
function answerByRangeSpec(options, hand, bands, fallbackAction = "fold", defaultMin = 0.001) {
  const h = (hand || "").toUpperCase();
  for (const b of bands || []) {
    const action = (b.action || "").toLowerCase();
    const min = typeof b.min === "number" ? b.min : defaultMin;
    const rmap = getRangeMap(b.range);
    if (!rmap.has(h)) continue;
    const w = Number(rmap.get(h) ?? 0);
    if (w >= min) return findIndexByAction(options, action);
  }
  return findIndexByAction(options, fallbackAction);
}

// bands の range(weight) を使って action別の「重み」を作り、
// 合計が 1.0 未満なら不足分を fold に寄せる（= fold が残り確率）
// 合計が 1.0 を超える場合だけ正規化して 1.0 に揃える
// bands の range(weight) を「確率」として解釈し、足りない分は fold に回す
function probsByRangeSpec(options, hand, bands, fallbackAction = "fold") {
  const h = (hand || "").toUpperCase();

  // options を「全文キー」で定義（"3bet 6bb" と "3bet 10bb" を分ける）
  const optionKeys = (options || []).map(actionKeyFromOption);

  const weights = Object.fromEntries(optionKeys.map(k => [k, 0]));

  for (const b of bands || []) {
    const bandKey = actionKeyFromBand(b.action);
    const rmap = getRangeMap(b.range);
    const w = Number(rmap.get(h) ?? 0);
    if (w <= 0) continue;

    // 1) 完全一致加算
    if (bandKey in weights) {
      weights[bandKey] += w;
      continue;
    }

    // 2) サイズ無し action 用に、先頭単語一致に加算（例: "open" -> "open 2.2bb"）
    const bandHead = bandKey.split(/\s+/)[0];
    for (const ok of optionKeys) {
      if (ok.split(/\s+/)[0] === bandHead) {
        weights[ok] += w;
      }
    }
  }

  // fold の「残り」：options の中に fold がある場合だけ残りを入れる
  const foldKey = optionKeys.find(k => k.split(/\s+/)[0] === "fold");
  if (foldKey) {
    const nonFoldSum = Object.entries(weights)
      .filter(([k]) => k !== foldKey)
      .reduce((a, [, v]) => a + v, 0);
    weights[foldKey] = Math.max(0, 1 - nonFoldSum);
  }

  // 正規化
  const sum = Object.values(weights).reduce((a, v) => a + v, 0);
  if (sum > 0) {
    for (const k in weights) weights[k] /= sum;
  }
  return weights;
}


// 文字列一致用：大小/余計な空白/表記ゆれ(x→bb)を潰したキー
function actionKeyFromOption(opt) {
  return String(opt || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/x\b/g, "bb"); // "2x" -> "2bb"
}

// band.action 用（"JAM" みたいなのも吸収）
function actionKeyFromBand(action) {
  return String(action || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}


function answerByMaxProb(options, probs, fallbackAction="fold") {
  let bestKey = actionKeyFromOption(fallbackAction);
  let best = 0;

  for (const opt of options || []) {
    const key = actionKeyFromOption(opt);
    const p = Number(probs?.[key] ?? 0);
    if (p > best) { best = p; bestKey = key; }
  }

  // 最大確率が極小なら fold（fold option がある前提で index を返す）
  if (best < 0.1) {
    const foldIdx = (options || []).findIndex(o => actionKeyFromOption(o).startsWith("fold"));
    return foldIdx !== -1 ? foldIdx : 0;
  }

  // bestKey を options の index に戻す
  const idx = (options || []).findIndex(o => actionKeyFromOption(o) === bestKey);
  return idx !== -1 ? idx : 0;
}

/* ================= テーブル可視化 ================= */
function polarToXY(r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { left: `${50 + r * Math.cos(rad)}%`, top: `${50 + r * Math.sin(rad)}%` };
}

function sixMaxLayout() {
  const angles = { UTG: -90, MP: -30, CO: 30, BTN: 90, SB: 150, BB: -150 };
  const r = 40;
  const coords = {};
  for (const p of POSITIONS6) coords[p] = polarToXY(r, angles[p]);
  return coords;
}

function badgeStyleFor(action) {
  if (!action) return { background: "#e5e7eb", color: "#111" };
  const a = action.toLowerCase();
  if (a.startsWith("open")) return { background: "#dbeafe", color: "#1e40af" };
  if (a.startsWith("call")) return { background: "#fef3c7", color: "#92400e" };
  if (a.startsWith("3bet") || a.startsWith("4bet")) return { background: "#ffe4e6", color: "#9f1239" };
  if (a.startsWith("jam") || a.includes("all-in")) return { background: "#dcfce7", color: "#065f46" };
  if (a.startsWith("fold")) return { background: "#f3f4f6", color: "#6b7280" };
  return { background: "#e5e7eb", color: "#111" };
}

function normalizeOptionToBB(opt) {
  if (!opt) return opt;
  const txt = opt.toLowerCase().trim();
  // "2.2x" -> "2.2bb"
  if (txt.includes("x")) return opt.replace(/x/gi, "bb");
  // callがサイズ無しなら見た目だけ補う
  if (txt.startsWith("call") && !txt.match(/[0-9]/)) return "Call";
  if (txt.startsWith("fold")) return "Fold 0bb";
  if (txt.startsWith("limp")) return "Limp 1bb";
  return opt;
}

function parseFacingOpen(facing) {
  const s = String(facing || "").trim();
  // 例: "BTN open 2x", "BTN open 2bb", "BTN open 2.2x"
  const m = s.match(/^(UTG|MP|CO|BTN|SB|BB)\s+open\s+([0-9]+(?:\.[0-9]+)?)\s*(x|bb)\b/i);
  if (!m) return null;

  const pos = m[1].toUpperCase();
  const num = Number(m[2]);
  if (!Number.isFinite(num) || num <= 0) return null;

  // x でも bb でも UI上は bb として表示（あなたの要望: "2x"→"2BB支払い"）
  const amountBB = num;

  return { pos, amountBB };
}

function PokerTable({ stacks, heroPos, heroHand, action, facing, patternId }) {
  const coords = useMemo(() => sixMaxLayout(), []);
  const facingOpen = useMemo(() => parseFacingOpen(facing), [facing]);
  const potBB = useMemo(() => calcTotalPotBB(patternId, facing), [patternId, facing]);

  return (
    <div style={styles.tableWrap}>
      <div style={styles.tableCircle}>
        <div style={styles.potCenter}>
          <div style={styles.potLabel}>POT</div>
          <div style={styles.potValue}>{Math.round(potBB * 100) / 100}bb</div>
        </div>
        {POSITIONS6.map((pos) => {
          const c = coords[pos];
          const isHero = pos === heroPos;
          const isSB = pos === "SB";
          const isBB = pos === "BB";
          const isOpener = facingOpen?.pos === pos;
          const openAmt = facingOpen?.amountBB ?? 0;
          const badge = badgeStyleFor(isHero ? action : null);

          return (
            <div
              key={pos}
              style={{
                ...styles.seat,
                ...c,
                ...(isHero ? styles.seatHero : {}),
                ...(isSB ? styles.sbSeat : {}),
                ...(isBB ? styles.bbSeat : {}),
              }}
            >
              <div style={styles.seatPos}>{pos}</div>
              <div style={styles.seatStack}>[{stacks[pos]}bb]</div>
              {isHero && <div style={styles.seatHand}>{heroHand}</div>}
              {isHero && action && (
                <div style={{ ...styles.badge, background: badge.background, color: badge.color }}>{action}</div>
              )}

              {/* SB/BB ブラインドチップ表示 */}
              {isSB && (
                <div style={{ ...styles.chipWrap, ...styles.chipWrapSB }}>
                  <div style={{ ...styles.chip, ...styles.chipSB }} />
                  <div style={styles.chipText}>{BLIND_SIZES.SB}bb</div>
                </div>
              )}
              {isBB && (
                <div style={{ ...styles.chipWrap, ...styles.chipWrapBB }}>
                  <div style={{ ...styles.chip, ...styles.chipBB }} />
                  <div style={styles.chipText}>{BLIND_SIZES.BB}bb</div>
                </div>
              )}

              {/* facing が "BTN open 2x" などの時、オープンした席にチップ表示 */}
              {isOpener && openAmt > 0 && (
               <div style={{ ...styles.chipWrap, ...styles.chipWrapOpen }}>
                 <div style={{ ...styles.chip, ...styles.chipOpen }} />
                 <div style={styles.chipText}>{openAmt}bb</div>
               </div>
             )}

            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProbBarChart({ options, probs }) {
  // options: ["Fold", "Open 2.2bb"] など
  // probs: { fold:0.2, open:0.8 } など（actionキーは小文字）
  const rows = (options || []).map((opt) => {
    const key = actionKeyFromOption(opt);
    const p = Math.max(0, Math.min(1, Number(probs?.[key] ?? 0)));
    return { opt, key, p };
  });

  return (
    <div style={styles.probWrap}>
      <div style={styles.probTitle}>アクション確率（RangeSpec weightベース）</div>
      <div style={styles.probGrid}>
        {rows.map((r) => (
          <div key={r.opt} style={styles.probRow}>
            <div style={styles.probLabel}>{r.opt}</div>
            <div style={styles.probBarOuter}>
              <div style={{ ...styles.probBarInner, width: `${Math.round(r.p * 1000) / 10}%` }} />
            </div>
            <div style={styles.probPct}>{(Math.round(r.p * 1000) / 10).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= PATTERNS（回答は range 文字列で定義） ================= */
// const PATTERNS = [
//   {
//     id: "btn-open ante",
//     label: "BTN Open（Unopened）",
//     questionBuilder: (hand) => ({
//       hand,
//       pos: "BTN",
//       eff: 40,
//       facing: "Unopened",
//       stacks: { UTG: 40, MP: 40, CO: 40, BTN: 40, SB: 40, BB: 40 },
//       options: ["Fold", "Open 2.2x"],
//     }),
//     bands: [
//       {
//         action: "open",
//         min: 0.05,
//         range: `
//               66+, 55:0.998, 44:0.686, A5s+, A4s:0.996, A3s:0.994, A2s:0.997, AKo, AQo:0.992, AJo-A7o,
//               A6o:0.809, A5o:0.999, A4o:0.012, K6s+, K5s:0.999, K4s, K3s:0.489, K2s:0.004,
//               KTo+, K9o:0.499, Q8s+, Q7s:0.999, Q6s:0.995, Q5s:0.990, Q3s:0.001, QTo+, Q9o:0.493,
//               J8s+, J7s:0.999, J6s:0.001, JTo, J9o:0.054, T9s, T8s:0.999, T7s:0.972, T9o:0.351,
//               98s, 97s:0.989, 87s:0.999, 76s:0.314, 65s:0.006, 54s:0.001
//         `.replace(/\n/g, " "),
//       },
//     ],
//     answerBuilder: (pattern, hand, _weight, optionsBB) =>
//       ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })

//   },
//   {
//     id: "sb-vs-btn ante",
//     label: "SB vs BTN 2x",
//     questionBuilder: (hand) => ({
//       hand,
//       pos: "SB",
//       eff: 25,
//       facing: "BTN open 2x",
//       stacks: { UTG: 25, MP: 25, CO: 25, BTN: 25, SB: 25, BB: 25 },
//       options: ["Fold", "Call", "3bet 7bb", "Jam 25bb"],
//     }),
//     bands: [
//           { action: "JAM", min: 0.05, range: `JJ:0.598, TT:0.760, 99:0.883, 88:0.314, 77:0.024, 66:0.131, 55:0.081, 44:0.677, 33:0.688, 22:0.630, AQs:0.390, ATs:0.001, A8s:0.758, A6s:0.071, A5s:0.588, A4s:0.432, A3s:0.608, A2s:0.546, AKo:0.801, AQo:0.989, AJo:0.375, ATo:0.017, KQs:0.750, KJs:0.608, KTs:0.865, K9s:0.011, K8s:0.006, K7s:0.032, K6s:0.028, K4s:0.040, KQo:0.444, KJo:0.913, KTo:0.489, QJs:0.698, QTs:0.928, Q9s:0.221, Q8s:0.069, QJo:0.254, QTo:0.006, JTs:0.354, J8s:0.004, JTo:0.043, T9s:0.053, 76s:0.001` },
//           { action: "3bet", min: 0.05, range: `QQ+, JJ:0.198, TT:0.233, 99:0.028, 88:0.254, 77:0.258, 66:0.220, 55:0.437, 44:0.098, 33:0.021, AKs, AQs:0.389, AJs:0.806, ATs:0.122, A8s:0.048, A7s:0.559, A6s:0.903, A5s:0.409, A4s:0.439, A3s:0.364, A2s:0.416, AKo:0.199, AQo:0.011, AJo:0.446, ATo:0.769, A9o:0.104, A8o:0.006, A6o:0.002, A5o:0.120, A4o:0.001, A3o:0.001, KQs:0.032, KJs:0.013, KTs:0.004, K9s:0.218, K8s:0.255, K7s:0.559, K6s:0.667, K5s:0.760, K4s:0.005, K3s:0.079, K2s:0.001, KQo:0.538, KJo:0.054, KTo:0.335, QJs:0.076, Q9s:0.398, Q8s:0.263, Q7s:0.026, Q6s:0.003, Q5s:0.081, Q4s:0.007, QJo:0.359, QTo:0.027, JTs:0.096, J9s:0.379, J8s:0.057, J7s:0.008, J6s:0.012, J5s:0.002, JTo:0.107, T9s:0.789, T8s:0.081, T7s:0.064, T6s:0.003, 98s:0.604, 87s:0.229, 76s:0.043, 54s:0.015` },
//           { action: "call", min: 0.05, range: `JJ:0.204, TT:0.008, 99:0.088, 88:0.432, 77:0.719, 66:0.650, 55:0.482, 44:0.221, 33:0.101, 22:0.006, AQs:0.221, AJs:0.194, ATs:0.877, A9s, A8s:0.194, A7s:0.441, A6s:0.025, A5s:0.003, A4s:0.130, A3s:0.027, A2s:0.037, AJo:0.179, ATo:0.215, A9o:0.128, KQs:0.219, KJs:0.379, KTs:0.131, K9s:0.770, K8s:0.647, K7s:0.064, K6s:0.008, K5s:0.001, KQo:0.018, KJo:0.033, KTo:0.072, QJs:0.227, QTs:0.071, Q9s:0.380, Q8s:0.319, Q7s:0.002, QJo:0.270, QTo:0.012, JTs:0.550, J9s:0.614, J8s:0.009, J7s:0.001, JTo:0.021, T9s:0.155, T8s:0.001, 98s:0.121, 97s:0.001, 87s:0.010, 86s:0.001, 76s:0.001, 64s:0.002, 54s:0.009` },
//     ],
//     answerBuilder: (pattern, hand, _weight, optionsBB) =>
//       ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.001)})
//   },
//   {
//     id: "btn open2 ante",
//     label: "BTN Open（Unopened）",
//     questionBuilder: (hand) => ({
//       hand,
//       pos: "BTN",
//       eff: 15,
//       facing: "Unopened",
//       stacks: { UTG: 15, MP: 15, CO: 15, BTN: 15, SB: 15, BB: 15 },
//       options: ["Fold","open 2bb", "Jam 15bb"],
//     }),
//     bands: [
//           { action: "Jam", min: 0.05, range: `QTs, JTs, KTs, A2s-A8s, QT-KT, A5o-AJo, KQo, 22-88, 99: 0.003, 67s: 0.3, 78s: 0.55` },
//           { action: "open", min: 0.05, range: `AQo+, TT+, 99: 0.997, A2o-A5o, KJs+, KJo+, QJs, 54s: 0.50, A9s+, K6s-K9s, Q9s` },
//     ],
//     answerBuilder: (pattern, hand, _weight, optionsBB) =>
//       ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
//   },
//   {
//     id: "75bb eff UTG open chase",
//     label: "UTG 75bb eff Open（クラブマッチ）",
//     questionBuilder: (hand) => ({
//       hand,
//       pos: "UTG",
//       eff: 75,
//       facing: "Unopened",
//       stacks: { UTG: 75, MP: 75, CO: 75, BTN: 75, SB: 75, BB: 75 },
//       options: ["Fold","open 2.3bb"],
//     }),
//     bands: [
//           { action: "open", min: 0.05, range: `TT+, 99:0.999, 88-77, 66:0.994, 55:0.957, 44:0.045, ATs+, A9s:0.999, A8s, A7s:0.999, A6s-A5s, A4s:0.993, A3s:0.995, A2s:0.994, ATo+, A9o:0.992, A8o:0.459, A7o:0.006, A6o:0.003, A5o:0.350, A4o:0.002, KQs, KJs:0.999, KTs:0.998, K9s:0.985, K8s:0.996, K7s:0.893, K6s:0.992, K5s:0.880, K4s:0.468, K2s:0.003, KQo, KJo:0.975, KTo:0.718, QJs:0.994, QTs:0.997, Q9s:0.926, Q8s:0.074, Q6s:0.001, QJo:0.713, QTo:0.011, JTs:0.995, J9s:0.928, J8s:0.105, T9s:0.976, T8s:0.761, 98s:0.327, 97s:0.036, 76s:0.374, 65s:0.118, 54s:0.007` },
//     ],
//     answerBuilder: (pattern, hand, _weight, optionsBB) =>
//       ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
//   },
//   {
//     id: "75bb eff HJ open chase",
//     label: "HJ 75bb eff Open（クラブマッチ）",
//     questionBuilder: (hand) => ({
//       hand,
//       pos: "HJ",
//       eff: 75,
//       facing: "Unopened",
//       stacks: { UTG: 75, MP: 75, CO: 75, BTN: 75, SB: 75, BB: 75 },
//       options: ["Fold","open 2.3bb"],
//     }),
//     bands: [
//           { action: "open", min: 0.05, range: `TT+, 99:0.999, 88-77, 66:0.996, 55:0.992, 44:0.691, ATs+, A9s:0.999, A8s:0.999, A7s:0.997, A6s-A5s, A4s:0.999, A3s, A2s:0.999, ATo+, A9o:0.999, A8o:0.988, A7o:0.436, A6o:0.008, A5o:0.885, A4o:0.029, A3o:0.001, A2o:0.001, KQs, KJs:0.999, KTs, K9s:0.997, K8s:0.996, K7s:0.995, K6s:0.984, K5s:0.996, K4s:0.923, K3s:0.134, K2s:0.008, KTo+, QJs:0.999, QTs:0.998, Q9s:0.982, Q8s:0.893, Q7s:0.083, Q6s:0.100, Q5s:0.020, QJo:0.993, QTo:0.445, JTs:0.998, J9s:0.986, J8s:0.779, J7s:0.001, JTo:0.643, T9s:0.991, T8s:0.955, T7s:0.711, 98s:0.935, 97s:0.771, 87s:0.373, 76s:0.801, 75s:0.022, 65s:0.353, 54s:0.002` },
//     ],
//     answerBuilder: (pattern, hand, _weight, optionsBB) =>
//       ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
//   },
//   {
//     id: "75bb eff CO open chase",
//     label: "CO 75bb eff Open（クラブマッチ）",
//     questionBuilder: (hand) => ({
//       hand,
//       pos: "CO",
//       eff: 75,
//       facing: "Unopened",
//       stacks: { UTG: 75, MP: 75, CO: 75, BTN: 75, SB: 75, BB: 75 },
//       options: ["Fold","open 2.3bb"],
//     }),
//     bands: [
//           { action: "open", min: 0.05, range: `77+, 66:0.999, 55:0.999, 44:0.999, 33:0.639, A2s+, A7o+, A6o:0.843, A5o, A4o:0.853, A3o:0.011, A2o:0.001, KTs+, K9s:0.999, K8s:0.999, K7s:0.999, K6s:0.995, K5s:0.997, K4s:0.996, K3s:0.984, K2s:0.934, KTo+, K9o:0.986, K8o:0.081, K7o:0.001, K6o:0.001, QTs+, Q9s:0.999, Q8s:0.998, Q7s:0.972, Q6s:0.985, Q5s:0.818, Q4s:0.370, Q3s:0.001, QTo+, Q9o:0.022, JTs:0.998, J9s:0.999, J8s:0.987, J7s:0.969, J6s:0.004, J5s:0.011, JTo:0.998, T9s, T8s:0.991, T7s:0.964, T6s:0.089, T9o:0.428, T8o:0.001, 98s:0.986, 97s:0.876, 96s:0.167, 87s:0.993, 86s:0.812, 85s:0.017, 76s:0.980, 75s:0.737, 65s:0.902, 54s:0.876` },
//     ],
//     answerBuilder: (pattern, hand, _weight, optionsBB) =>
//       ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
//   },
//   {
//     id: "75bb eff BTN open chase",
//     label: "BTN 75bb eff Open（クラブマッチ）",
//     questionBuilder: (hand) => ({
//       hand,
//       pos: "BTN",
//       eff: 75,
//       facing: "Unopened",
//       stacks: { UTG: 75, MP: 75, CO: 75, BTN: 75, SB: 75, BB: 75 },
//       options: ["Fold","open 2.3bb"],
//     }),
//     bands: [
//           { action: "open", min: 0.05, range: `22+, A2s+, A2o+, K7s+, K6s:0.999, K5s-K3s, K2s:0.998, K9o+, K8o:0.999, K7o-K6o, K5o:0.996, K4o:0.239, K3o:0.002, QJs:0.999, QTs, Q9s:0.999, Q8s:0.999, Q7s, Q6s:0.999, Q5s:0.997, Q4s:0.992, Q3s, Q2s:0.997, Q9o+, Q8o:0.987, Q7o:0.485, Q6o:0.003, JTs, J9s:0.999, J8s, J7s:0.999, J6s:0.997, J5s:0.999, J4s:0.996, J3s:0.998, J2s:0.927, J9o+, J8o:0.966, J7o:0.001, T9s, T8s:0.999, T7s:0.999, T6s:0.996, T5s:0.963, T4s:0.957, T3s:0.268, T2s:0.002, T9o, T8o:0.996, T7o:0.578, 98s:0.999, 97s:0.999, 96s, 95s:0.971, 94s:0.082, 98o:0.955, 97o:0.100, 87s:0.994, 86s:0.995, 85s:0.967, 84s:0.248, 82s:0.001, 87o:0.385, 86o:0.001, 76s:0.998, 75s:0.969, 74s:0.974, 73s:0.001, 76o:0.787, 65s, 64s:0.986, 63s:0.068, 65o:0.003, 54s:0.999, 53s:0.959, 43s:0.774, 42s:0.001` },
//     ],
//     answerBuilder: (pattern, hand, _weight, optionsBB) =>
//       ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
//   },
//   {
//     id: "75bb eff BTN-vsUTG chase",
//     label: "BTN 75bb eff BTN-vsUTG（クラブマッチ））",
//     questionBuilder: (hand) => ({
//       hand,
//       pos: "BTN",
//       eff: 75,
//       facing: "UTG open 2.3x",
//       stacks: { UTG: 75, MP: 75, CO: 75, BTN: 75, SB: 75, BB: 75 },
//       options: ["Fold","call", "3bet 6bb", "3bet 10bb"],
//     }),
//     bands: [
//           { action: "3bet 10bb", min: 0.05, range: `KK:0.415, QQ:0.999, JJ:0.926, TT:0.821, 99:0.984, 88:0.911, 77:0.938, 66:0.647, 55:0.781, 44:0.164, 33:0.051, AKs:0.359, AQs:0.991, AJs:0.846, ATs:0.998, A9s:0.940, A8s:0.810, A7s:0.369, A6s:0.211, A5s:0.554, A4s:0.004, A3s:0.016, A2s:0.429, AKo:0.207, AQo:0.402, AJo:0.897, ATo:0.276, KQs:0.992, KJs:0.969, KTs:0.996, K9s:0.742, K8s:0.257, K7s:0.026, K6s:0.042, KQo:0.737, KJo:0.028, QJs:0.850, QTs:0.979, JTs:0.870, J9s:0.001, J8s:0.002, T9s:0.887, T8s:0.001, T7s:0.033, 98s:0.005, 87s:0.161, 86s:0.001, 85s:0.002, 76s:0.414, 65s:0.810, 54s:0.137` },
//           { action: "3bet 6bb", min: 0.05, range: `AA:0.181, KK:0.284, JJ:0.074, TT:0.178, 99:0.015, 88:0.080, 77:0.049, 66:0.076, 55:0.037, 44:0.053, AKs:0.336, AQs:0.006, AJs:0.154, ATs:0.001, A9s:0.036, A8s:0.003, A7s:0.008, A6s:0.157, A5s:0.394, A4s:0.282, A3s:0.028, A2s:0.121, AKo:0.337, AQo:0.057, AJo:0.022, ATo:0.196, A4o:0.001, A3o:0.001, KQs:0.004, KJs:0.011, KTs:0.002, K9s:0.032, K8s:0.261, K7s:0.175, K6s:0.016, K5s:0.049, K4s:0.308, K3s:0.019, K2s:0.003, KQo:0.083, KJo:0.063, KTo:0.036, K7o:0.001, QJs:0.129, QTs:0.004, Q9s:0.065, Q8s:0.105, JTs:0.003, J9s:0.022, T7s:0.001, 98s:0.001, 87s:0.007, 76s:0.002, 75s:0.022, 65s:0.087, 54s:0.113, 53s:0.001` },
//           { action: "call", min: 0.05, range: `KK:0.415, QQ:0.999, JJ:0.926, TT:0.821, 99:0.984, 88:0.911, 77:0.938, 66:0.647, 55:0.781, 44:0.164, 33:0.051, AKs:0.359, AQs:0.991, AJs:0.846, ATs:0.998, A9s:0.940, A8s:0.810, A7s:0.369, A6s:0.211, A5s:0.554, A4s:0.004, A3s:0.016, A2s:0.429, AKo:0.207, AQo:0.402, AJo:0.897, ATo:0.276, KQs:0.992, KJs:0.969, KTs:0.996, K9s:0.742, K8s:0.257, K7s:0.026, K6s:0.042, KQo:0.737, KJo:0.028, QJs:0.850, QTs:0.979, JTs:0.870, J9s:0.001, J8s:0.002, T9s:0.887, T8s:0.001, T7s:0.033, 98s:0.005, 87s:0.161, 86s:0.001, 85s:0.002, 76s:0.414, 65s:0.810, 54s:0.137` },
//     ],
//     answerBuilder: (pattern, hand, _weight, optionsBB) =>
//       ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
//   },
//   {
//     id: "50bb eff UTG open chase",
//     label: "UTG 50bb eff Open（クラブマッチ）",
//     questionBuilder: (hand) => ({
//       hand,
//       pos: "UTG",
//       eff: 50,
//       facing: "Unopened",
//       stacks: { UTG: 50, MP: 50, CO: 50, BTN: 50, SB: 50, BB: 50 },
//       options: ["Fold","open 2.3bb"],
//     }),
//     bands: [
//           { action: "open", min: 0.05, range: `99+, 88:0.997, 77:0.999, 66:0.999, 55:0.729, A9s+, A8s:0.999, A7s, A6s:0.999, A5s:0.999, A4s:0.999, A3s, A2s:0.997, ATo+, A9o:0.996, A8o:0.451, A7o:0.055, A5o:0.946, A4o:0.073, A3o:0.002, KJs+, KTs:0.999, K9s:0.995, K8s:0.978, K7s:0.995, K6s:0.970, K5s:0.904, K4s:0.350, K3s:0.011, KJo+, KTo:0.583, K5o:0.001, QJs, QTs:0.999, Q9s:0.964, Q8s:0.085, Q7s:0.012, QJo:0.483, QTo:0.003, JTs:0.997, J9s:0.714, T9s:0.959, T8s:0.710, 98s:0.013, 76s:0.005` },
//     ],
//     answerBuilder: (pattern, hand, _weight, optionsBB) =>
//       ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
//   },
//   {
//     id: "50bb eff HJ open chase",
//     label: "HJ 50bb eff Open（クラブマッチ）",
//     questionBuilder: (hand) => ({
//       hand,
//       pos: "HJ",
//       eff: 50,
//       facing: "Unopened",
//       stacks: { UTG: 50, MP: 50, CO: 50, BTN: 50, SB: 50, BB: 50 },
//       options: ["Fold","open 2.3bb"],
//     }),
//     bands: [
//           { action: "open", min: 0.05, range: `99+, 88:0.999, 77, 66:0.997, 55:0.997, 44:0.618, 33:0.001, A8s+, A7s:0.999, A6s-A2s, A8o+, A7o:0.931, A6o:0.023, A5o:0.998, A4o:0.253, A3o:0.003, A2o:0.001, KQs, KJs:0.999, KTs, K9s:0.991, K8s, K7s:0.997, K6s:0.998, K5s:0.992, K4s:0.911, K3s:0.361, K2s:0.001, KJo+, KTo:0.999, K9o:0.001, QJs, QTs:0.999, Q9s:0.992, Q8s:0.923, Q7s:0.006, Q6s:0.294, QJo:0.998, QTo:0.537, JTs:0.998, J9s:0.984, J8s:0.867, JTo:0.466, T9s:0.986, T8s:0.934, T7s:0.581, 98s:0.808, 97s:0.158, 87s:0.078, 86s:0.006, 76s:0.385, 65s:0.693` },
//     ],
//     answerBuilder: (pattern, hand, _weight, optionsBB) =>
//       ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
//   },
//   {
//     id: "50bb eff CO open chase",
//     label: "CO 50bb eff Open（クラブマッチ）",
//     questionBuilder: (hand) => ({
//       hand,
//       pos: "CO",
//       eff: 50,
//       facing: "Unopened",
//       stacks: { UTG: 50, MP: 50, CO: 50, BTN: 50, SB: 50, BB: 50 },
//       options: ["Fold","open 2.3bb"],
//     }),
//     bands: [
//           { action: "open", min: 0.05, range: `66+, 55:0.999, 44:0.998, 33:0.415, 22:0.007, A2s+, A7o+, A6o:0.997, A5o, A4o:0.994, A3o:0.320, A2o:0.009, KTs+, K9s:0.999, K8s:0.999, K7s:0.996, K6s:0.999, K5s:0.996, K4s:0.996, K3s, K2s:0.989, KTo+, K9o:0.998, K8o:0.006, K7o:0.003, K6o:0.001, K4o:0.001, QJs:0.999, QTs, Q9s:0.994, Q8s, Q7s:0.951, Q6s:0.613, Q5s:0.966, Q4s:0.287, Q3s:0.001, QJo, QTo:0.998, Q9o:0.030, JTs, J9s:0.994, J8s:0.998, J7s:0.971, J6s:0.006, J5s:0.154, J4s:0.035, J2s:0.001, JTo:0.999, J9o:0.001, T9s:0.998, T8s:0.996, T7s:0.911, T6s:0.009, T9o:0.531, 98s:0.988, 97s:0.975, 96s:0.215, 87s:0.919, 86s:0.910, 76s:0.966, 75s:0.210, 65s:0.864, 54s:0.168` },
//     ],
//     answerBuilder: (pattern, hand, _weight, optionsBB) =>
//       ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
//   },
//   {
//     id: "50bb eff BTN open chase",
//     label: "BTN 50bb eff Open（クラブマッチ）",
//     questionBuilder: (hand) => ({
//       hand,
//       pos: "BTN",
//       eff: 50,
//       facing: "Unopened",
//       stacks: { UTG: 50, MP: 50, CO: 50, BTN: 50, SB: 50, BB: 50 },
//       options: ["Fold","open 2.3bb"],
//     }),
//     bands: [
//           { action: "open", min: 0.05, range: `55+, 44:0.999, 33-22, A2s+, A2o+, KTs+, K9s:0.999, K8s-K6s, K5s:0.997, K4s-K2s, K6o+, K5o:0.995, K4o:0.096, K3o:0.001, K2o:0.002, Q8s+, Q7s:0.999, Q6s:0.992, Q5s:0.998, Q4s:0.996, Q3s:0.998, Q2s:0.968, Q9o+, Q8o:0.986, Q7o:0.559, Q6o:0.004, JTs, J9s:0.998, J8s:0.998, J7s:0.998, J6s:0.994, J5s:0.996, J4s:0.950, J3s:0.520, J2s:0.290, J9o+, J8o:0.990, T7s+, T6s:0.999, T5s:0.927, T4s:0.848, T3s:0.386, T9o, T8o:0.991, T7o:0.440, 98s, 97s:0.999, 96s:0.992, 95s:0.742, 94s:0.025, 98o:0.972, 97o:0.004, 87s:0.997, 86s:0.991, 85s:0.996, 87o:0.428, 76s:0.999, 75s:0.991, 74s:0.618, 76o:0.203, 65s:0.999, 64s:0.862, 63s:0.001, 65o:0.004, 54s:0.998, 53s:0.978, 52s:0.001, 43s:0.003` },
//     ],
//     answerBuilder: (pattern, hand, _weight, optionsBB) =>
//       ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
//   },
//   {
//     id: "50bb eff BBvsUTG chase",
//     label: "BB 50bb eff BBvsUTG（クラブマッチ）",
//     questionBuilder: (hand) => ({
//       hand,
//       pos: "BB",
//       eff: 50,
//       facing: "UTG open 2.3x",
//       stacks: { UTG: 50, MP: 50, CO: 50, BTN: 50, SB: 50, BB: 50 },
//       options: ["Fold","call", "3bet 8.5bb"],
//     }),
//     bands: [
//           { action: "3bet 8.5bb", min: 0.05, range: `AA, KK:0.664, AKs:0.818, AQs:0.012, A9s:0.038, A7s:0.163, A6s:0.261, A5s:0.118, A4s:0.691, A3s:0.815, A2s:0.412, AKo:0.542, AQo:0.017, ATo:0.038, A9o:0.010, A8o:0.061, A7o:0.533, A6o:0.151, A5o:0.349, A4o:0.523, A3o:0.534, A2o:0.057, KTs:0.003, K7s:0.096, K6s:0.004, K5s:0.423, K4s:0.044, K3s:0.001, K2s:0.100, KJo:0.047, KTo:0.033, K9o:0.103, K8o:0.046, K7o:0.010, K6o:0.039, K5o:0.038, K4o:0.023, K3o:0.018, K2o:0.002, QJs:0.009, QTs:0.001, Q9s:0.015, Q8s:0.039, Q5s:0.004, Q4s:0.001, Q2s:0.095, QJo:0.029, QTo:0.066, Q9o:0.067, Q8o:0.051, JTs:0.005, J9s:0.001, J7s:0.141, J5s:0.155, J3s:0.040, J2s:0.007, T7s:0.001, T6s:0.006, T3s:0.005, T9o:0.001, T8o:0.013, 98s:0.030, 97s:0.055, 95s:0.038, 93s:0.003, 92s:0.001, 98o:0.015, 87s:0.080, 83s:0.001, 87o:0.042, 76s:0.008, 76o:0.027, 75o:0.025, 62s:0.043, 54s:0.055, 52s:0.003, 43s:0.025` },
//           { action: "call", min: 0.05, range: `KK:0.336, QQ-22, AKs:0.182, AQs:0.988, AJs-ATs, A9s:0.962, A8s, A7s:0.837, A6s:0.738, A5s:0.881, A4s:0.308, A3s:0.184, A2s:0.585, AKo:0.458, AQo:0.983, AJo, ATo:0.962, A9o:0.989, A8o:0.933, A7o:0.418, A6o:0.342, A5o:0.605, A4o:0.452, A3o:0.025, KJs+, KTs:0.997, K9s:0.992, K8s, K7s:0.904, K6s:0.995, K5s:0.576, K4s:0.939, K3s:0.991, K2s:0.886, KQo, KJo:0.953, KTo:0.967, K9o:0.722, K8o:0.281, K7o:0.177, QJs:0.991, QTs:0.999, Q9s:0.984, Q8s:0.960, Q7s:0.999, Q6s:0.999, Q5s:0.990, Q4s:0.991, Q3s:0.999, Q2s:0.898, QJo:0.971, QTo:0.928, Q9o:0.616, Q8o:0.150, JTs:0.994, J9s:0.999, J8s:0.997, J7s:0.857, J6s:0.991, J5s:0.449, J4s:0.725, J3s:0.418, J2s:0.075, JTo:0.994, J9o:0.600, J8o:0.003, T9s:0.999, T8s:0.995, T7s:0.999, T6s:0.986, T5s:0.989, T4s:0.298, T3s:0.078, T2s:0.001, T9o:0.988, T8o:0.707, 98s:0.966, 97s:0.944, 96s:0.998, 95s:0.284, 94s:0.332, 93s:0.136, 92s:0.171, 98o:0.798, 87s:0.918, 86s:0.993, 85s:0.998, 84s:0.977, 83s:0.002, 87o:0.618, 86o:0.001, 76s:0.992, 75s, 74s:0.988, 73s:0.461, 72s:0.006, 76o:0.967, 75o:0.257, 65s, 64s:0.999, 63s:0.974, 62s:0.683, 65o:0.978, 64o:0.141, 54s:0.945, 53s:0.997, 52s:0.982, 54o:0.517, 43s:0.971, 42s:0.994, 32s:0.734` },
//     ],
//     answerBuilder: (pattern, hand, _weight, optionsBB) =>
//       ({ index: answerByRangeSpec(optionsBB, hand, pattern.bands, "fold", 0.5) })
//   },
// ];

/* ================= 出題セット生成 ================= */
function sampleN(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

const DEFAULT_FALLBACK = "fold";
const DEFAULT_MIN = 0.5;

function getAnswerIndex(pattern, hand, optionsBB) {
  return answerByRangeSpec(optionsBB, hand, pattern.bands || [], DEFAULT_FALLBACK, DEFAULT_MIN);
}

function buildQuestionFromPattern(pattern, hand) {
  const qParams = pattern.questionBuilder(hand);
  const optionsBB = (qParams.options || []).map(normalizeOptionToBB);

  const probs = probsByRangeSpec(optionsBB, hand, pattern.bands || [], "fold");
  const answerIndex = answerByMaxProb(optionsBB, probs, "fold");

  return {
    id: `${pattern.id}-${qParams.eff}bb-${hand}`,
    hero: { hand, pos: qParams.pos, eff: qParams.eff, facing: qParams.facing },
    stacks: qParams.stacks,
    options: optionsBB,
    answer: answerIndex,
    note: `${pattern.label} / ${hand} → ${optionsBB[answerIndex]}`,
  };
}

function defaultAnswerBuilder(pattern, hand, _weight, optionsBB) {
  return {
    index: answerByRangeSpec(optionsBB, hand, pattern.bands || [], "fold", 0.5),
  };
}

function buildRandomSet(patternId, count, prevFirstHand = null) {
  const pattern = PATTERNS.find((p) => p.id === patternId) || PATTERNS[0];

  // 要望に合わせて「全169」からランダム出題
  const poolHands = ALL_HANDS;
  const picked = sampleN(poolHands, count);

  // 直前の1問目と同じになりやすい場合の軽い回避
  if (prevFirstHand && picked.length > 0 && picked[0] === prevFirstHand) {
    const swap = picked.findIndex((h) => h !== prevFirstHand);
    if (swap > 0) [picked[0], picked[swap]] = [picked[swap], picked[0]];
  }

  return picked.map((hand) => buildQuestionFromPattern(pattern, hand));
}

/* ================= メイン ================= */
export default function PreflopQuiz() {
  const location = useLocation();
  const navigate = useNavigate();

  const navPatternId = location.state?.patternId;
  const navCount = location.state?.count;

  const [patternId, setPatternId] = useState(() => navPatternId ?? PATTERNS[0].id);
  const [count, setCount] = useState(() => (Number.isFinite(navCount) ? navCount : 10));

  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);

  // Home からの遷移で state が来た時に反映（同一コンポーネント再利用時も安全）
  useEffect(() => {
    if (navPatternId) setPatternId(navPatternId);
    if (Number.isFinite(navCount)) setCount(navCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navPatternId, navCount]);

  // patternId / count が変わったら問題セット作り直し
  useEffect(() => {
    const qs = buildRandomSet(patternId, count);
    setQuestions(qs);
    setStep(0);
    setSelected(null);
    setLocked(false);
  }, [patternId, count]);

  function regenerate() {
    const prevFirstHand = questions?.[0]?.hero?.hand || null;
    const qs = buildRandomSet(patternId, count, prevFirstHand);
    setQuestions(qs);
    setStep(0);
    setSelected(null);
    setLocked(false);
  }

  function next() {
    if (!locked) return;
    if (step < questions.length - 1) {
      setStep((s) => s + 1);
      setSelected(null);
      setLocked(false);
    }
  }

  // Enter: 回答/次へ、R: 再生成
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter") {
        if (!locked && selected != null) setLocked(true);
        else if (locked) next();
      } else if (e.key.toLowerCase() === "r") {
        regenerate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, selected, step, questions.length, patternId, count]);

  if (!questions.length) return <div style={styles.wrap}>Loading...</div>;

  const q = questions[step];
  const pattern = PATTERNS.find((p) => p.id === patternId) || PATTERNS[0];
  const probs = probsByRangeSpec(q.options, q.hero.hand, pattern.bands || [], "fold");
  const stacks = q.stacks || Object.fromEntries(POSITIONS6.map((p) => [p, q.hero.eff]));
  const progress = Math.round(((step + 1) / Math.max(1, questions.length)) * 100);

  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>Preflop Quiz（PATTERNS × RangeSpec）</h1>

      <button
        style={styles.backBtn}
        onClick={() => navigate("/")}
      >
        ← 問題選択に戻る
      </button>


      {/* 設定 */}
      <div style={styles.toolbar}>
        <div style={styles.field}>
          <label>パターン：</label>
          <select value={patternId} onChange={(e) => setPatternId(e.target.value)}>
            {PATTERNS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label>問題数：</label>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Number(e.target.value || 10))}
            style={{ width: 72 }}
          />
        </div>

        <button style={styles.secondaryBtn} onClick={regenerate}>
          新しいセット作成（R）
        </button>

        <button
          style={styles.primaryBtn}
          onClick={() => {
            const prevFirstHand = questions?.[0]?.hero?.hand || null;
            const qs = buildRandomSet(patternId, count, prevFirstHand);
            setQuestions(qs);
            setStep(0);
            setSelected(null);
            setLocked(false);
          }}
        >
          この設定で開始
        </button>
      </div>

      {/* 進捗 */}
      <div style={styles.progressWrap}>
        <div style={{ ...styles.progressBar, width: `${progress}%` }} />
        <div style={styles.progressText}>
          {step + 1} / {questions.length}
        </div>
      </div>

      {/* 問題 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <div style={styles.spot}>
              {q.hero.pos} / {q.hero.eff}bb
            </div>
            <div style={styles.facing}>{q.hero.facing}</div>
          </div>
          <div style={styles.hand}>{q.hero.hand}</div>
        </div>

        <PokerTable
          stacks={stacks}
          heroPos={q.hero.pos}
          heroHand={q.hero.hand}
          action={selected != null ? q.options[selected] : null}
          facing={q.hero.facing}
          patternId={patternId}
        />

        {locked && <ProbBarChart options={q.options} probs={probs} />}

        <div>
          {q.options.map((opt, i) => {
            const isRight = locked && i === q.answer;
            const isWrong = locked && selected === i && i !== q.answer;
            return (
              <label key={i} style={{ ...styles.choice, ...(isRight ? styles.right : isWrong ? styles.wrong : {}) }}>
                <input
                  type="radio"
                  name={`opt-${q.id}`}
                  value={i}
                  checked={selected === i}
                  onChange={() => !locked && setSelected(i)}
                  disabled={locked}
                  style={{ marginRight: 8 }}
                />
                <span style={styles.optIndex}>{i + 1}.</span> {opt}
              </label>
            );
          })}
        </div>

        {!locked ? (
          <div style={styles.actions}>
            <button style={styles.primaryBtn} onClick={() => setLocked(true)} disabled={selected == null}>
              回答する（Enter）
            </button>
            <span style={styles.hint}>Enter:回答 / R:新セット</span>
          </div>
        ) : (
          <div style={styles.actionsCol}>
            <div style={{ fontWeight: 800 }}>
              正解: <span style={{ fontWeight: 900 }}>{q.options[q.answer]}</span>
            </div>
            <div style={styles.note}>{q.note}</div>
            <button style={styles.primaryBtn} onClick={next} disabled={step === questions.length - 1}>
              次の問題（Enter）
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= スタイル ================= */
const styles = {
  wrap: { maxWidth: 920, margin: "0 auto", padding: 16 },
  h1: { fontSize: 24, fontWeight: 900, marginBottom: 12 },

  toolbar: { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 12 },
  field: { display: "flex", alignItems: "center", gap: 8 },

  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
  },

  progressWrap: { position: "relative", background: "#f3f4f6", height: 8, borderRadius: 999, marginBottom: 8 },
  progressBar: { position: "absolute", inset: 0, height: 8, borderRadius: 999, background: "#111" },
  progressText: { textAlign: "right", fontSize: 12, marginTop: 6, opacity: 0.7 },

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,.04)",
    marginBottom: 12,
  },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  spot: { fontWeight: 800 },
  facing: { fontSize: 12, opacity: 0.7 },
  hand: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 22, fontWeight: 900 },

  choice: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    marginBottom: 8,
    background: "#fff",
  },
  right: { borderColor: "#86efac", background: "#f0fdf4" },
  wrong: { borderColor: "#fecaca", background: "#fef2f2" },
  optIndex: { fontWeight: 800, width: 18, display: "inline-block" },

  actions: { display: "flex", alignItems: "center", gap: 10, marginTop: 8 },
  actionsCol: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 },
  hint: { fontSize: 12, opacity: 0.7 },
  note: { fontSize: 12, opacity: 0.75 },

  /* poker table */
  tableWrap: { position: "relative", width: "min(92vw, 720px)", aspectRatio: "1 / 1", margin: "0 auto 12px" },
  tableCircle: {
    position: "absolute",
    inset: 0,
    margin: "auto",
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "radial-gradient(circle at 50% 50%, #065f46 0%, #064e3b 60%, #052e2b 100%)",
    boxShadow: "inset 0 0 0 8px rgba(255,255,255,0.06), 0 12px 30px rgba(0,0,0,.25)",
  },
  seat: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    minWidth: "clamp(72px, 14vw, 110px)",
    textAlign: "center",
    padding: 8,
    borderRadius: 12,
    background: "rgba(255,255,255,.9)",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 6px rgba(0,0,0,.08)",
  },
  seatHero: { border: "2px solid #111", boxShadow: "0 4px 10px rgba(0,0,0,.18)" },

  // SB/BB 強調
  sbSeat: { border: "2px solid #60a5fa", background: "rgba(219,234,254,.9)" },
  bbSeat: { border: "2px solid #2563eb", background: "rgba(191,219,254,.9)" },

  seatPos: { fontSize: 12, fontWeight: 800 },
  seatStack: { fontSize: 12, opacity: 0.85 },
  seatHand: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontWeight: 900, marginTop: 2 },

  badge: { display: "inline-block", marginTop: 6, padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 800 },

  // ブラインドチップ
  chipWrap: { position: "absolute", display: "flex", alignItems: "center", gap: 6, pointerEvents: "none" },
  chipWrapSB: { bottom: -8, right: -10 },
  chipWrapBB: { bottom: -8, left: -10 },
  chip: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    boxShadow: "0 1px 3px rgba(0,0,0,.3), inset 0 0 0 2px rgba(255,255,255,.7)",
  },
  chipSB: { background: "radial-gradient(circle at 35% 35%, #fde68a 0%, #f59e0b 60%, #b45309 100%)" },
  chipBB: { background: "radial-gradient(circle at 35% 35%, #93c5fd 0%, #3b82f6 60%, #1e40af 100%)" },
  chipText: {
    fontSize: 12,
    fontWeight: 900,
    background: "rgba(255,255,255,.92)",
    border: "1px solid #e5e7eb",
    padding: "2px 6px",
    borderRadius: 999,
  },
  probWrap: {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
  margin: "8px 0 12px",
  background: "#fff",
  },
  probTitle: { fontWeight: 900, marginBottom: 8, fontSize: 13 },
  probGrid: { display: "flex", flexDirection: "column", gap: 8 },
  probRow: { display: "grid", gridTemplateColumns: "120px 1fr 60px", gap: 10, alignItems: "center" },
  probLabel: { fontSize: 12, fontWeight: 800, opacity: 0.85 },
  probBarOuter: { height: 10, background: "#f3f4f6", borderRadius: 999, overflow: "hidden", border: "1px solid #e5e7eb" },
  probBarInner: { height: 10, background: "#111", borderRadius: 999 },
  probPct: { textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 12, fontWeight: 900, opacity: 0.85 },
  chipWrapOpen: { top: -10, left: "50%", transform: "translateX(-50%)" },
  chipOpen: { background: "radial-gradient(circle at 35% 35%, #e5e7eb 0%, #9ca3af 60%, #374151 100%)" },
  potCenter: {
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  padding: "10px 14px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(229,231,235,0.9)",
  boxShadow: "0 6px 18px rgba(0,0,0,.18)",
  textAlign: "center",
  minWidth: 110,
  pointerEvents: "none",
  },
  potLabel: { fontSize: 12, fontWeight: 900, letterSpacing: 0.5, opacity: 0.8 },
  potValue: { fontSize: 18, fontWeight: 900, fontVariantNumeric: "tabular-nums" },
};
