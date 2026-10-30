import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUsers, FiTrendingUp, FiCheckCircle, FiShield, 
  FiArrowUpRight, FiClock, FiActivity, FiLayers, 
  FiCalendar, FiFilter, FiZap, FiBarChart2 
} from 'react-icons/fi';

export default function AdminOverview({ stats, onNavigateToLeads, onFilterByService }) {
  const [dateRange, setDateRange] = useState('7d'); // 'today' | '7d' | '30d' | 'all'

  if (!stats) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--md-on-surface-variant)' }}>
        <FiActivity style={{ animation: 'spin 1.5s linear infinite', fontSize: '2rem', marginBottom: '1rem', color: 'var(--md-primary)' }} />
        <div>Loading dashboard analytics...</div>
      </div>
    );
  }

  const {
    total_leads = 0,
    new_today = 0,
    new_this_week = 0,
    status_counts = {},
    service_counts = {},
    daily_trends = [],
    trusted_form = {},
    recent_leads = []
  } = stats;

  const qualifiedCount = status_counts.qualified || 0;
  const contactedCount = status_counts.contacted || 0;
  const closedCount = status_counts.closed || 0;
  const newCount = status_counts.new || 0;

  const qualificationRate = total_leads > 0 
    ? Math.round((qualifiedCount / total_leads) * 100) 
    : 0;

  const conversionRate = total_leads > 0
    ? Math.round((closedCount / total_leads) * 100)
    : 0;

  // Exact website service vertical colors
  const categoryColors = {
    'Health Insurance': '#10B981',
    'Home Improvement': '#D97706',
    'Auto & Home Insurance': '#0B6B5C',
    'Debt Relief': '#EF4444',
    'Legal Help': '#8B5CF6',
    'Medicare': '#0891B2',
    'Flight Booking': '#E8B84A',
  };

  const defaultColor = '#03363A';
  const maxServiceCount = Math.max(...Object.values(service_counts), 1);

  // Generate SVG Points for 7-day trend chart
  const trendData = daily_trends.length > 0 ? daily_trends : [
    { day: 'Mon', count: 1 },
    { day: 'Tue', count: 2 },
    { day: 'Wed', count: 1 },
    { day: 'Thu', count: 3 },
    { day: 'Fri', count: 2 },
    { day: 'Sat', count: 4 },
    { day: 'Sun', count: total_leads || 5 }
  ];

  const maxTrend = Math.max(...trendData.map(d => d.count), 5);
  const chartWidth = 500;
  const chartHeight = 120;
  
  const points = trendData.map((d, idx) => {
    const x = (idx / (trendData.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - (d.count / maxTrend) * (chartHeight - 30) - 15;
    return { x, y, count: d.count, day: d.day };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Top Banner Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--md-on-surface)' }}>
            Executive Overview
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)' }}>
            Real-time analytics and quote lead acquisition metrics
          </span>
        </div>

        {/* Date Range Picker Segmented Control */}
        <div className="admin-segmented-pills">
          <button 
            className={`admin-segmented-pill ${dateRange === 'today' ? 'active' : ''}`}
            onClick={() => setDateRange('today')}
          >
            Today
          </button>
          <button 
            className={`admin-segmented-pill ${dateRange === '7d' ? 'active' : ''}`}
            onClick={() => setDateRange('7d')}
          >
            Last 7 Days
          </button>
          <button 
            className={`admin-segmented-pill ${dateRange === '30d' ? 'active' : ''}`}
            onClick={() => setDateRange('30d')}
          >
            Last 30 Days
          </button>
          <button 
            className={`admin-segmented-pill ${dateRange === 'all' ? 'active' : ''}`}
            onClick={() => setDateRange('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="admin-metrics-grid">
        {/* Card 1: Total Leads */}
        <div 
          className="admin-metric-card" 
          style={{ '--accent-gradient': 'linear-gradient(135deg, #03363A 0%, #0B6B5C 100%)' }}
          onClick={onNavigateToLeads}
        >
          <div className="admin-metric-header">
            <span className="admin-metric-title">Total Inquiries</span>
            <div className="admin-metric-icon" style={{ color: '#03363A' }}>
              <FiUsers />
            </div>
          </div>
          <div className="admin-metric-value-row">
            <div className="admin-metric-value">{total_leads}</div>
            <div className="admin-metric-subtext positive">
              <FiTrendingUp /> +{new_this_week} this week
            </div>
          </div>
          <div className="admin-metric-subtext">
            <span>Click to explore database</span>
          </div>
        </div>

        {/* Card 2: New Today */}
        <div className="admin-metric-card" style={{ '--accent-gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
          <div className="admin-metric-header">
            <span className="admin-metric-title">New Inflow Today</span>
            <div className="admin-metric-icon" style={{ color: '#f59e0b' }}>
              <FiClock />
            </div>
          </div>
          <div className="admin-metric-value-row">
            <div className="admin-metric-value">{new_today}</div>
            <div className="admin-metric-subtext" style={{ color: '#f59e0b', fontWeight: 700 }}>
              <FiZap /> Real-time
            </div>
          </div>
          <div className="admin-metric-subtext">
            <span>Direct web quote submissions</span>
          </div>
        </div>

        {/* Card 3: Qualification Rate */}
        <div className="admin-metric-card" style={{ '--accent-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <div className="admin-metric-header">
            <span className="admin-metric-title">Qualified Rate</span>
            <div className="admin-metric-icon" style={{ color: '#10b981' }}>
              <FiCheckCircle />
            </div>
          </div>
          <div className="admin-metric-value-row">
            <div className="admin-metric-value">{qualificationRate}%</div>
            <div className="admin-metric-subtext positive">
              <FiArrowUpRight /> {qualifiedCount} leads
            </div>
          </div>
          <div className="admin-metric-subtext">
            <span>High-intent customer matches</span>
          </div>
        </div>

        {/* Card 4: TrustedForm Compliance */}
        <div className="admin-metric-card" style={{ '--accent-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}>
          <div className="admin-metric-header">
            <span className="admin-metric-title">TrustedForm Compliance</span>
            <div className="admin-metric-icon" style={{ color: '#8b5cf6' }}>
              <FiShield />
            </div>
          </div>
          <div className="admin-metric-value-row">
            <div className="admin-metric-value">{trusted_form.percentage || 0}%</div>
            <div className="admin-metric-subtext" style={{ color: '#8b5cf6', fontWeight: 700 }}>
              Active
            </div>
          </div>
          <div className="admin-metric-subtext">
            <span>{trusted_form.retained || 0} claimed certificates</span>
          </div>
        </div>
      </div>

      {/* Charts & Funnel Grid */}
      <div className="admin-charts-grid">
        {/* Left: Trend Sparkline & Service Verticals */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">
                <FiBarChart2 style={{ color: '#0B6B5C' }} />
                Lead Volume Trend & Service Breakdown
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--md-on-surface-variant)' }}>
                7-day daily activity curve & vertical demand share
              </span>
            </div>
            <button className="admin-btn-secondary" onClick={onNavigateToLeads}>
              View All <FiArrowUpRight />
            </button>
          </div>

          {/* SVG Area Chart */}
          <div className="admin-area-chart-container">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0B6B5C" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0B6B5C" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#trendGradient)" />
              <path d={pathD} fill="none" stroke="#0B6B5C" strokeWidth="3" strokeLinecap="round" />
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#0B6B5C" strokeWidth="2.5" />
                  <text x={p.x} y={chartHeight + 14} textAnchor="middle" fontSize="10" fill="var(--md-on-surface-variant)" fontWeight="600">
                    {p.day.slice(-5)}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Horizontal Category Bars */}
          <div className="admin-chart-bars">
            {Object.keys(service_counts).length === 0 ? (
              <div style={{ color: 'var(--md-on-surface-variant)', fontSize: '0.9rem', padding: '1rem 0' }}>
                No vertical data available yet.
              </div>
            ) : (
              Object.entries(service_counts).map(([service, count]) => {
                const pct = Math.round((count / maxServiceCount) * 100);
                const color = categoryColors[service] || defaultColor;
                return (
                  <div 
                    className="admin-bar-item" 
                    key={service} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => onFilterByService ? onFilterByService(service) : onNavigateToLeads()}
                    title={`Filter by ${service}`}
                  >
                    <div className="admin-bar-info">
                      <span className="admin-bar-name">
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
                        {service}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--md-on-surface)' }}>
                        {count} leads ({total_leads > 0 ? Math.round((count / total_leads) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="admin-bar-track">
                      <div
                        className="admin-bar-fill"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Conversion Funnel & Pipeline */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">
                <FiActivity style={{ color: '#10b981' }} />
                Conversion Pipeline
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--md-on-surface-variant)' }}>
                Lead progression from intake to closed
              </span>
            </div>
          </div>

          <div className="admin-funnel-pipeline">
            <div className="admin-funnel-stage">
              <div className="admin-funnel-left">
                <span className="admin-funnel-badge-dot" style={{ backgroundColor: '#0B6B5C' }} />
                <div>
                  <div className="admin-funnel-title">New Inquiries</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}>Awaiting review</span>
                </div>
              </div>
              <span className="admin-funnel-count" style={{ color: '#0B6B5C' }}>{newCount}</span>
            </div>

            <div className="admin-funnel-stage">
              <div className="admin-funnel-left">
                <span className="admin-funnel-badge-dot" style={{ backgroundColor: '#d97706' }} />
                <div>
                  <div className="admin-funnel-title">Contacted</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}>In communication</span>
                </div>
              </div>
              <span className="admin-funnel-count" style={{ color: '#d97706' }}>{contactedCount}</span>
            </div>

            <div className="admin-funnel-stage">
              <div className="admin-funnel-left">
                <span className="admin-funnel-badge-dot" style={{ backgroundColor: '#10b981' }} />
                <div>
                  <div className="admin-funnel-title">Qualified</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}>Matched with provider</span>
                </div>
              </div>
              <span className="admin-funnel-count" style={{ color: '#10b981' }}>{qualifiedCount}</span>
            </div>

            <div className="admin-funnel-stage">
              <div className="admin-funnel-left">
                <span className="admin-funnel-badge-dot" style={{ backgroundColor: '#64748b' }} />
                <div>
                  <div className="admin-funnel-title">Closed / Converted</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}>Deal concluded</span>
                </div>
              </div>
              <span className="admin-funnel-count" style={{ color: '#64748b' }}>{closedCount}</span>
            </div>

            {/* Overall Conversion Pill Card */}
            <div style={{ background: 'var(--md-primary-container)', padding: '0.85rem 1rem', borderRadius: '12px', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--md-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  End-to-End Conversion
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--md-on-surface-variant)' }}>
                  Total won deals vs total inflow
                </div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--md-primary)' }}>
                {conversionRate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions Feed */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3 className="admin-panel-title">
              <FiClock style={{ color: '#f59e0b' }} />
              Live Lead Submissions
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--md-on-surface-variant)' }}>
              Most recent quote requests captured by the system
            </span>
          </div>
          <button className="admin-btn-secondary" onClick={onNavigateToLeads}>
            Open Command Center
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Zip Code</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {recent_leads.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--md-on-surface-variant)', padding: '2rem' }}>
                    No recent lead activity.
                  </td>
                </tr>
              ) : (
                recent_leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="admin-customer-cell">
                        <span className="admin-customer-name">{lead.first_name} {lead.last_name}</span>
                        <span className="admin-customer-sub">{lead.email}</span>
                      </div>
                    </td>
                    <td><strong>{lead.service_type}</strong></td>
                    <td>{lead.zip_code}</td>
                    <td>
                      <span className={`status-pill ${lead.status}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
