import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCost, formatTokens } from '../../services/aiProviders';
import { Coins, Sparkles, TrendingDown } from 'lucide-react';

/**
 * TokenTracker Component.
 * ----------------------
 * Renders the session-level and generation-level AI token usage and estimated pricing metrics dashboard.
 *
 * Visual Features:
 *   - Implements a smooth animation loop using browser `requestAnimationFrame` and an
 *     ease-out quadratic interpolation curve to animate numerical counters when a new resume is tailored.
 *   - Renders input/output split token statistics with custom HSL-colored badge panels.
 *   - Displays cumulative total session token weights and cost accumulations.
 *
 * @returns {React.ReactElement} The rendered Token Dashboard container.
 */
export default function TokenTracker() {
  const { state } = useApp();
  const { currentGeneration, totalTokens, totalCost } = state;
  
  const [animatedTokens, setAnimatedTokens] = useState({ input: 0, output: 0, total: 0 });
  const [animatedCost, setAnimatedCost] = useState(0);

  // Smooth animation for counter numbers using quadratic ease-out interpolation
  // Runs automatically whenever a new AI generation is loaded into state.currentGeneration.
  useEffect(() => {
    if (!currentGeneration) return;
    
    const targetTokens = currentGeneration.tokens || { input: 0, output: 0, total: 0 };
    const targetCost = currentGeneration.cost || 0;

    let startTimestamp = null;
    const duration = 1000; // 1 second animation

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing out quadratic
      const ease = progress * (2 - progress);

      setAnimatedTokens({
        input: Math.floor(ease * (targetTokens.input || 0)),
        output: Math.floor(ease * (targetTokens.output || 0)),
        total: Math.floor(ease * (targetTokens.total || 0)),
      });
      setAnimatedCost(ease * targetCost);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [currentGeneration]);

  return (
    <div className="token-tracker">
      <div className="token-tracker-header">
        <h4 className="token-tracker-title">
          <Coins size={16} className="text-accent-violet-light" />
          <span>Session Token Dashboard</span>
        </h4>
        {currentGeneration && (
          <span className="badge badge-cyan animate-pulse">
            <Sparkles size={10} />
            <span>Latest Generation</span>
          </span>
        )}
      </div>

      {currentGeneration ? (
        <div className="animate-fadeIn">
          <div className="token-stat-grid">
            <div className="token-stat">
              <div className="token-stat-value violet">
                {formatTokens(animatedTokens.input)}
              </div>
              <div className="token-stat-label">Input Tokens</div>
            </div>
            <div className="token-stat">
              <div className="token-stat-value cyan">
                {formatTokens(animatedTokens.output)}
              </div>
              <div className="token-stat-label">Output Tokens</div>
            </div>
          </div>
          
          <div className="cost-display">
            <div className="input-label" style={{ marginBottom: 0 }}>Latest Generation Cost:</div>
            <div className="cost-value">{formatCost(animatedCost)}</div>
          </div>
        </div>
      ) : (
        <div className="empty-state" style={{ padding: 'var(--space-4) 0' }}>
          <p className="empty-state-description" style={{ fontSize: 'var(--text-xs)' }}>
            No generations in this session yet. Provide a JD and press Generate to track token usage and exact pricing.
          </p>
        </div>
      )}

      {/* Cumulative Stats */}
      {totalTokens.total > 0 && (
        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px dashed var(--color-border)' }} className="animate-fadeIn">
          <div className="input-label" style={{ marginBottom: 'var(--space-2)' }}>Cumulative Session Stats:</div>
          <div className="token-stat-grid" style={{ marginBottom: 'var(--space-3)' }}>
            <div className="token-stat" style={{ padding: 'var(--space-1) var(--space-2)' }}>
              <div className="token-stat-value" style={{ fontSize: 'var(--text-md)' }}>
                {formatTokens(totalTokens.total)}
              </div>
              <div className="token-stat-label" style={{ fontSize: '10px' }}>Total Tokens</div>
            </div>
            <div className="token-stat" style={{ padding: 'var(--space-1) var(--space-2)' }}>
              <div className="token-stat-value success" style={{ fontSize: 'var(--text-md)' }}>
                {formatCost(totalCost)}
              </div>
              <div className="token-stat-label" style={{ fontSize: '10px' }}>Total Cost</div>
            </div>
          </div>
          
          <div className="badge badge-violet" style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-1)' }}>
            <TrendingDown size={12} />
            <span>Token-efficient caching active (Express Backend)</span>
          </div>
        </div>
      )}
    </div>
  );
}
