import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEcoData } from '../hooks/useEcoData';
import UsageChart from '../components/UsageChart';
import { formatNumber } from '../utils/formatters';
import { getComparisons } from '../data/comparisons';
import { Zap, Droplets, Cloud, ArrowRight, BookOpen } from 'lucide-react';

/* ── Animated count-up ────────────────────────────────────── */
function useCountUp(target, duration = 1500) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null, raf;
    const step = ts => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      setVal(target * (1 - Math.pow(1 - pct, 3)));
      if (pct < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function N({ value, decimals = 0 }) {
  const v = useCountUp(value);
  return <>{formatNumber(v, decimals)}</>;
}

/* ── Metric split chapter (02, 03, 04) ───────────────────── */
function MetricChapter({ chapterNum, panelCls, tagCls, icon: Icon, label, value, decimals, unit, equivs, reversed }) {
  const numPanel = (
    <div className={`sb-num-panel ${panelCls}`}>
      <div className={`sb-metric-tag ${tagCls}`}>
        <Icon size={11} />{label}
      </div>
      <div>
        <span className="sb-big-num"><N value={value} decimals={decimals} /></span>
        <span className="sb-big-unit">{unit}</span>
      </div>
    </div>
  );

  const ctxPanel = (
    <div className="sb-ctx-panel">
      <div className="sb-ctx-eyebrow">In real life, that's…</div>
      {equivs.map((eq, i) => (
        <div key={i} className="sb-equiv-item">
          <span className="sb-equiv-emoji">{eq.emoji}</span>
          <div>
            <div className="sb-equiv-big">
              {formatNumber(eq.count, eq.count < 1 ? 2 : eq.count < 10 ? 1 : 0)}
            </div>
            <div className="sb-equiv-desc">{eq.title}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section className={`sb-chapter sb-split${reversed ? ' sb-split--rev' : ''}`}>
      <span className="sb-bg-num" aria-hidden="true">{chapterNum}</span>
      {reversed ? <>{ctxPanel}{numPanel}</> : <>{numPanel}{ctxPanel}</>}
    </section>
  );
}

/* ── Projection slider ────────────────────────────────────── */
function Projection({ energyPerConvo, waterPerConvo, carbonPerConvo }) {
  const [daily, setDaily] = useState(5);
  const annual = daily * 365;

  return (
    <section className="sb-projection sb-chapter">
      <span className="sb-bg-num" style={{ color: 'rgba(44,62,80,0.025)' }} aria-hidden="true">07</span>
      <span className="sb-section-eyebrow">What if you keep going?</span>
      <h2 className="sb-section-heading">Annual Impact Projection</h2>

      <div className="sb-projection-slider-row">
        <div className="sb-projection-count-wrap">
          <span className="sb-projection-count">{daily}</span>
          <span className="sb-projection-count-label">convos / day</span>
        </div>
        <input
          type="range" min={1} max={50} value={daily}
          onChange={e => setDaily(Number(e.target.value))}
          className="sb-projection-range"
          aria-label="Daily conversations"
        />
        <span className="sb-projection-year-label">
          {annual.toLocaleString()} / yr
        </span>
      </div>

      <div className="sb-projection-results">
        <div className="sb-projection-result sb-projection-result--energy">
          <div className="sb-projection-result-bar" />
          <span className="sb-projection-result-num">{formatNumber(energyPerConvo * annual, 3)}</span>
          <span className="sb-projection-result-unit">kWh</span>
          <span className="sb-projection-result-label">energy</span>
        </div>
        <div className="sb-projection-result sb-projection-result--water">
          <div className="sb-projection-result-bar" />
          <span className="sb-projection-result-num">{formatNumber(waterPerConvo * annual, 2)}</span>
          <span className="sb-projection-result-unit">liters</span>
          <span className="sb-projection-result-label">water</span>
        </div>
        <div className="sb-projection-result sb-projection-result--carbon">
          <div className="sb-projection-result-bar" />
          <span className="sb-projection-result-num">{formatNumber(carbonPerConvo * annual, 2)}</span>
          <span className="sb-projection-result-unit">g CO₂</span>
          <span className="sb-projection-result-label">carbon</span>
        </div>
      </div>
    </section>
  );
}

/* ── Dashboard ────────────────────────────────────────────── */
export default function Dashboard() {
  const { hasData, totals, monthlyData } = useEcoData();
  const navigate = useNavigate();

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in px-8">
        <h2 className="text-2xl font-black text-navy mb-4">No data yet</h2>
        <p className="text-slate font-bold mb-6">Upload your conversations.json to see your impact.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-navy text-white font-black text-sm uppercase tracking-wider border-4 border-navy hover:bg-black transition-colors"
        >
          Upload Data
        </button>
      </div>
    );
  }

  const comparisons = getComparisons(totals);
  const energyPerConvo = totals.energyKwh   / totals.totalConversations;
  const waterPerConvo  = totals.waterLiters  / totals.totalConversations;
  const carbonPerConvo = totals.carbonGrams  / totals.totalConversations;
  const avgTokens      = Math.round(totals.totalTokens / totals.totalConversations);

  return (
    <div className="animate-fade-in-up">

      {/* ── 01 Opening ─────────────────────────────────────── */}
      <section className="sb-opening sb-chapter">
        <span className="sb-bg-num" aria-hidden="true">01</span>
        <div className="sb-opening-inner">
          <div className="sb-opening-tag">AI Footprint Report</div>
          <h1 className="sb-opening-headline">
            <span className="sb-opening-accent">
              <N value={totals.totalConversations} decimals={0} />
            </span>{' '}
            conversations<br />with AI.
          </h1>
          <p className="sb-opening-body">
            Here's the environmental story behind every message you sent.
          </p>
          <div className="sb-opening-stats">
            <div className="sb-stat">
              <span className="sb-stat-num"><N value={totals.totalTokens} decimals={0} /></span>
              <span className="sb-stat-label">tokens processed</span>
            </div>
            <div className="sb-stat-sep" />
            <div className="sb-stat">
              <span className="sb-stat-num">{formatNumber(avgTokens)}</span>
              <span className="sb-stat-label">avg tokens / convo</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 02 Energy ──────────────────────────────────────── */}
      <MetricChapter
        chapterNum="02"
        panelCls="sb-num-panel--energy"
        tagCls="sb-metric-tag--energy"
        icon={Zap}
        label="Energy Consumed"
        value={totals.energyKwh}
        decimals={4}
        unit="kWh"
        equivs={[comparisons.badges[0], comparisons.badges[1]]}
        reversed={false}
      />

      {/* ── 03 Water ───────────────────────────────────────── */}
      <MetricChapter
        chapterNum="03"
        panelCls="sb-num-panel--water"
        tagCls="sb-metric-tag--water"
        icon={Droplets}
        label="Water Usage"
        value={totals.waterLiters}
        decimals={2}
        unit="liters"
        equivs={[comparisons.badges[2], comparisons.badges[3]]}
        reversed={true}
      />

      {/* ── 04 Carbon ──────────────────────────────────────── */}
      <MetricChapter
        chapterNum="04"
        panelCls="sb-num-panel--carbon"
        tagCls="sb-metric-tag--carbon"
        icon={Cloud}
        label="Carbon Footprint"
        value={totals.carbonGrams}
        decimals={2}
        unit="g CO₂"
        equivs={[comparisons.badges[4], comparisons.badges[5]]}
        reversed={false}
      />

      {/* ── 05 In Perspective ──────────────────────────────── */}
      <section className="sb-perspective sb-chapter">
        <span className="sb-bg-num" style={{ color: 'rgba(44,62,80,0.025)' }} aria-hidden="true">05</span>
        <span className="sb-section-eyebrow">The full picture</span>
        <h2 className="sb-section-heading">In perspective</h2>
        <div className="sb-perspective-grid">
          {comparisons.badges.map((badge, i) => (
            <div key={i} className="sb-perspective-tile">
              <div className="sb-perspective-emoji">{badge.emoji}</div>
              <div className="sb-perspective-num">
                {formatNumber(badge.count, badge.count < 1 ? 2 : badge.count < 10 ? 1 : 0)}
              </div>
              <div className="sb-perspective-label">{badge.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 06 Per-conversation ────────────────────────────── */}
      <div className="sb-per-convo">
        <div className="sb-per-convo-item">
          <span className="sb-per-convo-num" style={{ color: '#FAC206' }}>
            {formatNumber(energyPerConvo, 5)}
          </span>
          <span className="sb-per-convo-unit">kWh</span>
        </div>
        <div className="sb-per-convo-item">
          <span className="sb-per-convo-num" style={{ color: '#16C0FF' }}>
            {formatNumber(waterPerConvo, 3)}
          </span>
          <span className="sb-per-convo-unit">liters</span>
        </div>
        <div className="sb-per-convo-item">
          <span className="sb-per-convo-num" style={{ color: '#FB4B5F' }}>
            {formatNumber(carbonPerConvo, 3)}
          </span>
          <span className="sb-per-convo-unit">g CO₂</span>
        </div>
      </div>

      {/* ── 07 Projection ──────────────────────────────────── */}
      <Projection
        energyPerConvo={energyPerConvo}
        waterPerConvo={waterPerConvo}
        carbonPerConvo={carbonPerConvo}
      />

      {/* ── 08 Monthly chart ───────────────────────────────── */}
      {monthlyData.length > 1 && (
        <section className="sb-chart sb-chapter">
          <span className="sb-bg-num" style={{ color: 'rgba(44,62,80,0.025)' }} aria-hidden="true">08</span>
          <span className="sb-section-eyebrow">Over time</span>
          <h2 className="sb-section-heading">Monthly usage</h2>
          <UsageChart data={monthlyData} />
        </section>
      )}

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="sb-cta sb-chapter">
        <span className="sb-bg-num" aria-hidden="true">09</span>
        <h2 className="sb-cta-headline">
          Awareness is<br />the first step.
        </h2>
        <p className="sb-cta-sub">
          See personalized tips to cut your footprint, or explore the methodology behind every number.
        </p>
        <div className="sb-cta-btns">
          <button onClick={() => navigate('/insights')} className="sb-cta-btn-primary">
            Reduce My Impact <ArrowRight size={14} />
          </button>
          <button onClick={() => navigate('/methodology')} className="sb-cta-btn-secondary">
            Methodology <BookOpen size={14} />
          </button>
        </div>
      </section>

      {/* ── Disclaimer ─────────────────────────────────────── */}
      <div className="sb-disclaimer">
        <p className="text-xs text-slate font-bold">
          Estimates based on publicly available research.{' '}
          <button onClick={() => navigate('/methodology')} className="text-green underline font-black">
            See methodology →
          </button>
        </p>
      </div>

    </div>
  );
}
