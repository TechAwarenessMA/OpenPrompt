import { useNavigate } from 'react-router-dom';
import { useEcoData } from '../hooks/useEcoData';
import UsageChart from '../components/UsageChart';
import { formatNumber, formatDate } from '../utils/formatters';
import { getComparisons } from '../data/comparisons';
import { COEFFICIENTS } from '../data/coefficients';
import { Zap, Droplets, Cloud, ArrowRight, BookOpen, Calendar } from 'lucide-react';

/* ── Big 3 Metric Card ─────────────────────────────────────── */
function MetricCard({ label, value, decimals, unit, icon: Icon, accentColor, shadowColor, comparison }) {
  return (
    <div
      className="bg-white border-4 border-navy p-6 flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
      style={{ boxShadow: `8px 8px 0px 0px ${shadowColor}` }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 flex items-center justify-center border-2 border-navy"
          style={{ background: accentColor }}
        >
          <Icon size={16} className="text-navy" />
        </div>
        <span className="text-xs font-black text-slate uppercase tracking-wider">{label}</span>
      </div>

      <div className="mt-1">
        <span className="text-6xl md:text-7xl font-black text-navy leading-none tracking-tight">
          {formatNumber(value, decimals)}
        </span>
        <span className="text-base font-black text-slate ml-2 uppercase">{unit}</span>
      </div>

      {comparison && (
        <p className="text-sm font-bold text-slate border-t-2 border-navy/10 pt-3 mt-1">
          <span className="text-lg mr-1">{comparison.emoji}</span>
          {comparison.description}
        </p>
      )}

      <p className="text-xs font-bold text-slate/50 mt-auto">
        Estimated ±{COEFFICIENTS.uncertainty_range_pct}%
      </p>
    </div>
  );
}

/* ── Token Distribution Panel ──────────────────────────────── */
function TokenPanel({ inputTokens, outputTokens }) {
  const total = inputTokens + outputTokens;
  const inputPct = total > 0 ? Math.round((inputTokens / total) * 100) : 0;
  const outputPct = 100 - inputPct;

  // Energy contribution (output costs ~3x more)
  const inputEnergyWh = inputTokens * COEFFICIENTS.energy_per_input_token_wh;
  const outputEnergyWh = outputTokens * COEFFICIENTS.energy_per_output_token_wh;
  const totalEnergyWh = inputEnergyWh + outputEnergyWh;
  const inputEnergyPct = totalEnergyWh > 0 ? Math.round((inputEnergyWh / totalEnergyWh) * 100) : 0;
  const outputEnergyPct = 100 - inputEnergyPct;

  return (
    <div
      className="bg-white border-4 border-navy p-6"
      style={{ boxShadow: '4px 4px 0px 0px #2C3E50' }}
    >
      <h2 className="text-lg font-black text-navy uppercase tracking-wider mb-5">
        Token Distribution
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="p-5 bg-cream border-4 border-navy/10">
          <p className="text-xs font-black text-slate uppercase tracking-wider mb-2">
            Your Prompts (Input)
          </p>
          <p className="text-3xl font-black text-navy">{formatNumber(inputTokens)}</p>
          <p className="text-xs font-bold text-slate mt-1">
            {inputPct}% of tokens · {inputEnergyPct}% of energy
          </p>
        </div>
        <div className="p-5 bg-cream border-4 border-navy/10">
          <p className="text-xs font-black text-slate uppercase tracking-wider mb-2">
            Claude's Replies (Output)
          </p>
          <p className="text-3xl font-black text-navy">{formatNumber(outputTokens)}</p>
          <p className="text-xs font-bold text-slate mt-1">
            {outputPct}% of tokens · {outputEnergyPct}% of energy
          </p>
        </div>
      </div>

      {/* Token ratio bar */}
      <p className="text-xs font-black text-slate uppercase tracking-wider mb-2">Token Ratio</p>
      <div className="h-4 border-4 border-navy flex overflow-hidden">
        <div className="bg-sky transition-all" style={{ width: `${inputPct}%` }} />
        <div className="bg-coral flex-1" />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs font-black text-sky">Input · {inputPct}%</span>
        <span className="text-xs font-black text-coral">Output · {outputPct}%</span>
      </div>

      {/* Energy ratio bar */}
      <p className="text-xs font-black text-slate uppercase tracking-wider mb-2 mt-4">Energy Contribution</p>
      <div className="h-4 border-4 border-navy flex overflow-hidden">
        <div className="bg-sky transition-all" style={{ width: `${inputEnergyPct}%` }} />
        <div className="bg-coral flex-1" />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs font-black text-sky">Input · {inputEnergyPct}%</span>
        <span className="text-xs font-black text-coral">Output · {outputEnergyPct}%</span>
      </div>
      <p className="text-xs font-bold text-slate/60 mt-3">
        Output tokens cost ~3× more energy than input tokens (autoregressive generation vs. single forward pass)
      </p>
    </div>
  );
}

/* ── Fun Facts Strip ───────────────────────────────────────── */
function FunFacts({ comparisons }) {
  const facts = [
    {
      emoji: comparisons.badges[0].emoji,
      text: `Your AI usage = leaving a lightbulb on for ${formatNumber(comparisons.badges[0].count, 1)} hours`,
    },
    {
      emoji: comparisons.badges[2].emoji,
      text: `That's the same water as ${formatNumber(comparisons.badges[2].count, 1)} water bottles`,
    },
    {
      emoji: comparisons.badges[4].emoji,
      text: `Carbon equivalent of driving ${formatNumber(comparisons.badges[4].count, 2)} miles`,
    },
    {
      emoji: comparisons.badges[5].emoji,
      text: `Same CO₂ as charging your phone ${formatNumber(comparisons.badges[5].count, 1)} times`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {facts.map((fact, i) => (
        <div
          key={i}
          className="bg-sunshine border-4 border-navy p-5 text-ink font-black text-sm leading-snug transition-transform hover:-translate-y-0.5"
          style={{ boxShadow: '4px 4px 0px 0px #2C3E50' }}
        >
          <span className="text-3xl block mb-3">{fact.emoji}</span>
          {fact.text}
        </div>
      ))}
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────── */
export default function Dashboard() {
  const { hasData, totals, monthlyData, dateRange } = useEcoData();
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
          className="px-6 py-3 bg-sunshine text-ink font-black text-sm uppercase tracking-wider border-4 border-navy hover:-translate-y-0.5 transition-transform"
          style={{ boxShadow: '4px 4px 0px 0px #2C3E50' }}
        >
          Upload Data
        </button>
      </div>
    );
  }

  const comparisons  = getComparisons(totals);
  const inputTokens  = totals.inputTokens  ?? 0;
  const outputTokens = totals.outputTokens ?? 0;
  const totalMessages = totals.totalMessages ?? 0;
  const avgTokens    = Math.round(totals.totalTokens / totals.totalConversations);

  const dateLabel =
    dateRange?.earliest && dateRange?.latest
      ? `${formatDate(dateRange.earliest)} — ${formatDate(dateRange.latest)}`
      : null;

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Header Row ──────────────────────────────────────── */}
      <div
        className="border-4 border-navy bg-white p-6"
        style={{ boxShadow: '4px 4px 0px 0px #2C3E50' }}
      >
        <h1 className="text-3xl md:text-4xl font-black text-navy tracking-tight uppercase">
          Your Impact
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
          {dateLabel && (
            <span className="flex items-center gap-1.5 text-sm font-bold text-slate">
              <Calendar size={14} />
              {dateLabel}
            </span>
          )}
          <span className="text-sm font-bold text-navy bg-cream border-2 border-navy/10 px-2 py-0.5">
            {totals.totalConversations.toLocaleString()} conversations
          </span>
          {totalMessages > 0 && (
            <span className="text-sm font-bold text-navy bg-cream border-2 border-navy/10 px-2 py-0.5">
              {totalMessages.toLocaleString()} messages
            </span>
          )}
          <span className="text-sm font-bold text-slate">
            {formatNumber(avgTokens)} avg tokens/convo
          </span>
        </div>

        <p className="text-xs font-bold text-slate/60 mt-3">
          Calculated using {COEFFICIENTS.model_label} coefficients ·{' '}
          estimates ±{COEFFICIENTS.uncertainty_range_pct}% ·{' '}
          <button
            onClick={() => navigate('/methodology')}
            className="text-green underline font-black"
          >
            See methodology
          </button>
        </p>
      </div>

      {/* ── Big 3 Metric Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Carbon"
          value={totals.carbonGrams}
          decimals={2}
          unit="g CO₂e"
          icon={Cloud}
          accentColor="#FB4B5F"
          shadowColor="#FB4B5F"
          comparison={comparisons.badges[4]}
        />
        <MetricCard
          label="Water"
          value={totals.waterLiters}
          decimals={2}
          unit="liters"
          icon={Droplets}
          accentColor="#16C0FF"
          shadowColor="#16C0FF"
          comparison={comparisons.badges[2]}
        />
        <MetricCard
          label="Energy"
          value={totals.energyKwh}
          decimals={4}
          unit="kWh"
          icon={Zap}
          accentColor="#2ECC71"
          shadowColor="#2ECC71"
          comparison={comparisons.badges[0]}
        />
      </div>

      {/* ── Fun Facts Strip ─────────────────────────────────── */}
      <FunFacts comparisons={comparisons} />

      {/* ── Monthly Usage Chart ─────────────────────────────── */}
      {monthlyData.length > 1 && (
        <div
          className="bg-white border-4 border-navy p-6"
          style={{ boxShadow: '4px 4px 0px 0px #2C3E50' }}
        >
          <h2 className="text-lg font-black text-navy uppercase tracking-wider mb-4">
            Monthly Usage
          </h2>
          <UsageChart data={monthlyData} />
        </div>
      )}

      {/* ── Token Distribution ──────────────────────────────── */}
      <TokenPanel inputTokens={inputTokens} outputTokens={outputTokens} />

      {/* ── CTA Strip ───────────────────────────────────────── */}
      <div
        className="border-4 border-navy bg-navy p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ boxShadow: '4px 4px 0px 0px #FAC206' }}
      >
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wide">
            Awareness is the first step.
          </h2>
          <p className="text-sm font-bold text-white/60 mt-1">
            See personalized tips or explore the methodology behind every number.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/insights')}
            className="flex items-center gap-2 px-5 py-3 bg-sunshine border-4 border-navy text-ink font-black text-sm uppercase tracking-wider hover:-translate-y-0.5 transition-transform min-h-12"
          >
            Reduce My Impact <ArrowRight size={14} />
          </button>
          <button
            onClick={() => navigate('/methodology')}
            className="flex items-center gap-2 px-5 py-3 bg-transparent border-4 border-white/30 text-white font-black text-sm uppercase tracking-wider hover:border-sunshine hover:text-sunshine transition-colors min-h-12"
          >
            Methodology <BookOpen size={14} />
          </button>
        </div>
      </div>

      {/* ── Disclaimer ──────────────────────────────────────── */}
      <p className="text-xs text-slate font-bold text-center py-2">
        These are estimates, not measurements.{' '}
        <button
          onClick={() => navigate('/methodology')}
          className="text-green underline font-black"
        >
          See methodology →
        </button>
      </p>

    </div>
  );
}
