import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEcoData } from '../hooks/useEcoData';
import UsageChart from '../components/UsageChart';
import { formatNumber } from '../utils/formatters';
import { getComparisons } from '../data/comparisons';
import { Zap, Droplets, Cloud, ArrowRight, BookOpen } from 'lucide-react';

/* ── Animated count-up ──────────────────────────────────── */
function useCountUp(target, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(target * ease);
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

/* ── Metric column ──────────────────────────────────────── */
function MetricCol({ cls, icon: Icon, label, value, decimals, unit, equivs }) {
  return (
    <div className={`dash-metric ${cls}`}>
      <div className="dash-metric-label">
        <Icon size={12} />
        {label}
      </div>
      <div>
        <span className="dash-metric-num">
          <N value={value} decimals={decimals} />
        </span>
        <span className="dash-metric-unit">{unit}</span>
      </div>
      <div className="dash-metric-equivs">
        {equivs.map((eq, i) => (
          <div key={i} className="dash-metric-equiv-row">
            <span className="dash-metric-equiv-emoji">{eq.emoji}</span>
            <span className="dash-metric-equiv-text">
              {eq.description.replace('Equivalent to ', '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Projection slider ──────────────────────────────────── */
function Projection({ energyPerConvo, waterPerConvo, carbonPerConvo }) {
  const [daily, setDaily] = useState(5);
  const annual = daily * 365;
  return (
    <section className="dash-projection">
      <span className="dash-section-label">What if you keep going?</span>
      <h2 className="dash-section-heading">Annual Impact Projection</h2>

      <div className="dash-projection-slider-row">
        <div className="dash-projection-count-group">
          <span className="dash-projection-count">{daily}</span>
          <span className="dash-projection-count-label">convos / day</span>
        </div>
        <input
          type="range" min={1} max={50} value={daily}
          onChange={e => setDaily(Number(e.target.value))}
          className="dash-projection-range"
          aria-label="Daily conversations"
        />
        <span className="dash-projection-range-label">
          {annual.toLocaleString()} / yr
        </span>
      </div>

      <div className="dash-projection-results">
        <div className="dash-projection-result dash-projection-result--energy">
          <div className="dash-projection-result-accent" />
          <span className="dash-projection-result-num">
            {formatNumber(energyPerConvo * annual, 3)}
          </span>
          <span className="dash-projection-result-unit">kWh</span>
          <span className="dash-projection-result-label">energy</span>
        </div>
        <div className="dash-projection-result dash-projection-result--water">
          <div className="dash-projection-result-accent" />
          <span className="dash-projection-result-num">
            {formatNumber(waterPerConvo * annual, 2)}
          </span>
          <span className="dash-projection-result-unit">liters</span>
          <span className="dash-projection-result-label">water</span>
        </div>
        <div className="dash-projection-result dash-projection-result--carbon">
          <div className="dash-projection-result-accent" />
          <span className="dash-projection-result-num">
            {formatNumber(carbonPerConvo * annual, 2)}
          </span>
          <span className="dash-projection-result-unit">g CO₂</span>
          <span className="dash-projection-result-label">carbon</span>
        </div>
      </div>
    </section>
  );
}

/* ── Main Dashboard ─────────────────────────────────────── */
export default function Dashboard() {
  const { hasData, totals, monthlyData } = useEcoData();
  const navigate = useNavigate();

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in px-8">
        <h2 className="text-2xl font-black text-navy mb-4">No data yet</h2>
        <p className="text-slate font-bold mb-6">
          Upload your conversations.json to see your impact.
        </p>
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
  const energyPerConvo = totals.energyKwh / totals.totalConversations;
  const waterPerConvo  = totals.waterLiters / totals.totalConversations;
  const carbonPerConvo = totals.carbonGrams / totals.totalConversations;

  return (
    <div className="animate-fade-in-up">

      {/* ── 1. Hero ─────────────────────────────────────── */}
      <section className="dash-hero">
        <div className="dash-hero-tag">AI Footprint Report</div>
        <h1 className="dash-hero-headline">
          <span className="dash-hero-num">
            <N value={totals.totalConversations} decimals={0} />
          </span>{' '}conversations
        </h1>
        <p className="dash-hero-sub">Here's what they cost the planet.</p>
        <div className="dash-hero-meta">
          <div className="dash-hero-meta-item">
            <span className="dash-hero-meta-val">
              <N value={totals.totalTokens} decimals={0} />
            </span>
            <span className="dash-hero-meta-label">tokens processed</span>
          </div>
          <div className="dash-hero-meta-div" />
          <div className="dash-hero-meta-item">
            <span className="dash-hero-meta-val" style={{ color: '#FAC206' }}>
              <N value={totals.energyKwh} decimals={4} />
            </span>
            <span className="dash-hero-meta-label">kWh energy</span>
          </div>
          <div className="dash-hero-meta-div" />
          <div className="dash-hero-meta-item">
            <span className="dash-hero-meta-val" style={{ color: '#16C0FF' }}>
              <N value={totals.waterLiters} decimals={1} />
            </span>
            <span className="dash-hero-meta-label">liters of water</span>
          </div>
          <div className="dash-hero-meta-div" />
          <div className="dash-hero-meta-item">
            <span className="dash-hero-meta-val" style={{ color: '#FB4B5F' }}>
              <N value={totals.carbonGrams} decimals={1} />
            </span>
            <span className="dash-hero-meta-label">grams CO₂</span>
          </div>
        </div>
      </section>

      {/* ── 2. Three metric columns ─────────────────────── */}
      <div className="dash-metrics-block">
        <MetricCol
          cls="dash-metric--energy"
          icon={Zap}
          label="Energy Consumed"
          value={totals.energyKwh}
          decimals={4}
          unit="kWh"
          equivs={[comparisons.badges[0], comparisons.badges[1]]}
        />
        <MetricCol
          cls="dash-metric--water"
          icon={Droplets}
          label="Water Usage"
          value={totals.waterLiters}
          decimals={2}
          unit="liters"
          equivs={[comparisons.badges[2], comparisons.badges[3]]}
        />
        <MetricCol
          cls="dash-metric--carbon"
          icon={Cloud}
          label="Carbon Footprint"
          value={totals.carbonGrams}
          decimals={2}
          unit="g CO₂"
          equivs={[comparisons.badges[4], comparisons.badges[5]]}
        />
      </div>

      {/* ── 3. Context cards ────────────────────────────── */}
      <section className="dash-context">
        <span className="dash-section-label">In perspective</span>
        <h2 className="dash-section-heading">What does this really mean?</h2>
        <div className="dash-context-grid">
          {comparisons.badges.map((badge, i) => (
            <div key={i} className="dash-context-card">
              <div className="dash-context-emoji">{badge.emoji}</div>
              <div className="dash-context-num">
                {formatNumber(badge.count, badge.count < 1 ? 2 : badge.count < 10 ? 1 : 0)}
              </div>
              <div className="dash-context-desc">{badge.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Per-conversation strip ────────────────────── */}
      <div className="dash-per-convo">
        <div className="dash-per-convo-item">
          <span className="dash-per-convo-num" style={{ color: '#FAC206' }}>
            {formatNumber(energyPerConvo, 5)}
          </span>
          <span className="dash-per-convo-label">kWh per conversation</span>
        </div>
        <div className="dash-per-convo-item">
          <span className="dash-per-convo-num" style={{ color: '#16C0FF' }}>
            {formatNumber(waterPerConvo, 3)}
          </span>
          <span className="dash-per-convo-label">liters per conversation</span>
        </div>
        <div className="dash-per-convo-item">
          <span className="dash-per-convo-num" style={{ color: '#FB4B5F' }}>
            {formatNumber(carbonPerConvo, 3)}
          </span>
          <span className="dash-per-convo-label">g CO₂ per conversation</span>
        </div>
      </div>

      {/* ── 5. Projection slider ────────────────────────── */}
      <Projection
        energyPerConvo={energyPerConvo}
        waterPerConvo={waterPerConvo}
        carbonPerConvo={carbonPerConvo}
      />

      {/* ── 6. Monthly chart ────────────────────────────── */}
      {monthlyData.length > 1 && (
        <section className="dash-chart">
          <span className="dash-section-label">Over time</span>
          <h2 className="dash-section-heading" style={{ marginBottom: '1.25rem' }}>
            Monthly Usage
          </h2>
          <UsageChart data={monthlyData} />
        </section>
      )}

      {/* ── 7. Action CTA ───────────────────────────────── */}
      <section className="dash-action">
        <h2 className="dash-action-headline">
          Awareness is the first step.<br />
          What will you do with it?
        </h2>
        <p className="dash-action-sub">
          Explore tips to reduce your footprint and understand the methodology behind these numbers.
        </p>
        <div className="dash-action-btns">
          <button onClick={() => navigate('/insights')} className="dash-action-btn-primary">
            Reduce My Impact <ArrowRight size={14} />
          </button>
          <button onClick={() => navigate('/methodology')} className="dash-action-btn-secondary">
            How We Calculate <BookOpen size={14} />
          </button>
        </div>
      </section>

      {/* ── Disclaimer ──────────────────────────────────── */}
      <div className="dash-disclaimer">
        <p className="text-xs text-slate font-bold">
          Estimates based on publicly available research data.{' '}
          <button onClick={() => navigate('/methodology')} className="text-green underline font-black">
            See methodology →
          </button>
        </p>
      </div>

    </div>
  );
}
