'use client'

import { useLocation } from "react-router-dom"
import { useState, useCallback } from "react"

const RiskIndicator = ({ risk }) => {
  const configs = {
    high: { dot: "bg-rose-500", border: "border-l-4 border-l-rose-500", label: "High Risk", color: "text-rose-400" },
    medium: { dot: "bg-amber-500", border: "border-l-4 border-l-amber-500", label: "Medium Risk", color: "text-amber-400" },
    low: { dot: "bg-emerald-500", border: "border-l-4 border-l-emerald-500", label: "Low Risk", color: "text-emerald-400" },
  }
  const config = configs[risk] || configs.low
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  )
}

const SuggestionPanel = ({ item, isOpen, onClose }) => {
  const [copiedField, setCopiedField] = useState(null)

  if (!isOpen) return null

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text || '').then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  const suggestions = [
    { title: "Issue Summary",   content: item.analysis?.plain_issue_explanation },
    { title: "Why It Matters",      content: item.analysis?.why_it_matters },
    { title: "Key Risk Points",     content: item.analysis?.quick_risk_points?.join(" • ") },
    { title: "Recommended Fix",     content: item.analysis?.recommended_fix_summary },
    { title: "Safer Clause Version", content: item.analysis?.improved_clause_text, copyable: true },
  ]

  const risk = item.risk_level || "low"
  const riskThemes = {
    high: {
      border: "border-rose-500/20",
      glow: "shadow-[0_20px_50px_-12px_rgba(244,63,94,0.15)]",
      badgeBg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      bgGradient: "from-rose-500/5 via-transparent to-transparent",
    },
    medium: {
      border: "border-amber-500/20",
      glow: "shadow-[0_20px_50px_-12px_rgba(245,158,11,0.15)]",
      badgeBg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      bgGradient: "from-amber-500/5 via-transparent to-transparent",
    },
    low: {
      border: "border-emerald-500/20",
      glow: "shadow-[0_20px_50px_-12px_rgba(16,185,129,0.15)]",
      badgeBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-450",
      bgGradient: "from-emerald-500/5 via-transparent to-transparent",
    }
  }

  const theme = riskThemes[risk] || riskThemes.low

  const getTheme = (title) => {
    switch (title) {
      case "Issue Summary":
        return {
          icon: (
            <svg className="w-4.5 h-4.5 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          ),
          accent: "border-l-4 border-l-rose-500",
          cardBg: "bg-rose-950/5 border-rose-900/10"
        }
      case "Why It Matters":
        return {
          icon: (
            <svg className="w-4.5 h-4.5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.795H10.23L11.812 3 3 14.805h7.195z" />
            </svg>
          ),
          accent: "border-l-4 border-l-indigo-500",
          cardBg: "bg-indigo-950/5 border-indigo-900/10"
        }
      case "Key Risk Points":
        return {
          icon: (
            <svg className="w-4.5 h-4.5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          ),
          accent: "border-l-4 border-l-amber-500",
          cardBg: "bg-amber-950/5 border-amber-900/10"
        }
      case "Recommended Fix":
        return {
          icon: (
            <svg className="w-4.5 h-4.5 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          ),
          accent: "border-l-4 border-l-teal-500",
          cardBg: "bg-teal-950/5 border-teal-900/10"
        }
      case "Safer Clause Version":
        return {
          icon: (
            <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          accent: "border-l-4 border-l-emerald-500",
          cardBg: "bg-emerald-950/5 border-emerald-900/10"
        }
      default:
        return {
          icon: null,
          accent: "border-l-4 border-l-slate-700",
          cardBg: "bg-slate-900/50"
        }
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in">
      <div className={`relative bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 shadow-2xl ${theme.glow}`}>
        
        {/* Glow effect at top left */}
        <div className={`absolute top-0 left-0 w-96 h-96 bg-gradient-to-br ${theme.bgGradient} rounded-full blur-3xl pointer-events-none`} />

        {/* Header */}
        <div className="relative sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-8 py-6 flex items-center justify-between z-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${theme.badgeBg}`}>
                {risk === "high" ? "High Risk" : risk === "medium" ? "Medium Risk" : "Protective"}
              </span>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                {item.predicted_label_name}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">Detailed Analysis</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800/60 rounded-xl transition text-slate-400 hover:text-white cursor-pointer active:scale-95"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Grid */}
        <div className="p-8 overflow-y-auto flex-1 z-10 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestions.map((suggestion, i) => {
              if (!suggestion.content) return null;
              const cardTheme = getTheme(suggestion.title);
              const isSaferClause = suggestion.title === "Safer Clause Version";

              return (
                <div
                  key={i}
                  className={`bg-slate-950/20 border border-slate-800/80 rounded-xl p-6 hover:border-slate-700/60 transition-all duration-300 animate-in fade-in slide-in-from-bottom ${cardTheme.accent} ${isSaferClause ? 'md:col-span-2' : ''}`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      {cardTheme.icon}
                      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{suggestion.title}</h3>
                    </div>
                    {suggestion.copyable && (
                      <button
                        onClick={() => copyToClipboard(suggestion.content, i)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-300 cursor-pointer active:scale-95 ${
                          copiedField === i
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-355 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/85 hover:border-slate-650'
                        }`}
                      >
                        {copiedField === i ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {isSaferClause ? (
                    <div className="bg-slate-950/80 rounded-lg p-4 border border-slate-800/60">
                      <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                        {suggestion.content}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {suggestion.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Result() {
  const { state } = useLocation()
  const results = state?.result || []
  const [expandedItems, setExpandedItems] = useState({})
  const [expandedSuggestion, setExpandedSuggestion] = useState(null)
  const [filterRisk, setFilterRisk] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const toggleExpand = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const truncateText = (text, limit = 150) => {
    if (!text) return ""
    return text.length > limit ? text.substring(0, limit) + "..." : text
  }

  const resultsWithStableId = results.map((r, i) => ({ ...r, originalIndex: i }))
  
  const riskWeights = { high: 3, medium: 2, low: 1 }

  const processedResults = resultsWithStableId
    .filter(r => filterRisk === "all" || r.risk_level === filterRisk)
    .filter(r => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return r.clause?.toLowerCase().includes(q) || r.predicted_label_name?.toLowerCase().includes(q)
    })
    .sort((a, b) => (riskWeights[b.risk_level] || 0) - (riskWeights[a.risk_level] || 0))

  const highRiskCount = results.filter(r => r.risk_level === "high").length
  const mediumRiskCount = results.filter(r => r.risk_level === "medium").length
  const lowRiskCount = results.filter(r => r.risk_level === "low").length

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background gradient accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-96 bg-gradient-to-b from-blue-600/10 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 p-6 md:p-12 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-slate-400">
            Analysis Results
          </h1>
          <p className="text-slate-400 text-lg">Review detected clauses and AI-powered risk insights</p>
        </div>

        {/* Contract Overview Card */}
        <div className="mb-12 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-8">Contract Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Contract Type</p>
              <p className="text-2xl font-bold text-slate-200">{state?.contract_type || "N/A"}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Clause Coverage</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-blue-400">{state?.coverage_score || 0}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Clauses Detected</p>
              <p className="text-2xl font-bold text-slate-200">{state?.total_clauses || 0}</p>
            </div>
          </div>

          {/* Elegant Progress Bar */}
          <div className="mt-8">
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${state?.coverage_score || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Risk Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* High Risk */}
          <div 
            onClick={() => setFilterRisk(filterRisk === 'high' ? 'all' : 'high')}
            className={`cursor-pointer border rounded-xl p-6 transition ${filterRisk === 'high' ? 'bg-slate-800/60 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-slate-800/30 border-rose-500/20 hover:border-rose-500/40 hover:bg-slate-800/50'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-rose-500 rounded-full" />
              <span className="text-xs font-semibold text-rose-400 uppercase">High Risk</span>
            </div>
            <div className="text-4xl font-bold text-white">{highRiskCount}</div>
          </div>

          {/* Medium Risk */}
          <div 
            onClick={() => setFilterRisk(filterRisk === 'medium' ? 'all' : 'medium')}
            className={`cursor-pointer border rounded-xl p-6 transition ${filterRisk === 'medium' ? 'bg-slate-800/60 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800/30 border-amber-500/20 hover:border-amber-500/40 hover:bg-slate-800/50'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <span className="text-xs font-semibold text-amber-400 uppercase">Medium Risk</span>
            </div>
            <div className="text-4xl font-bold text-white">{mediumRiskCount}</div>
          </div>

          {/* Low Risk */}
          <div 
            onClick={() => setFilterRisk(filterRisk === 'low' ? 'all' : 'low')}
            className={`cursor-pointer border rounded-xl p-6 transition ${filterRisk === 'low' ? 'bg-slate-800/60 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-800/30 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-slate-800/50'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-xs font-semibold text-emerald-400 uppercase">Protective</span>
            </div>
            <div className="text-4xl font-bold text-white">{lowRiskCount}</div>
          </div>
        </div>

        {/* Missing Clauses Alert */}
        {state?.missing_clauses?.length > 0 && (
          <div className="mb-12 bg-gradient-to-r from-rose-500/5 to-rose-500/0 border border-rose-500/20 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-rose-500 text-xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-white mb-2">Missing Important Clauses</h3>
                <p className="text-sm text-slate-400 mb-4">
                  These clauses are typically expected in a {state.contract_type} and their absence may expose your business to risk.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {state.missing_clauses.map((clause, index) => (
                <span key={index} className="px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-medium rounded-lg border border-rose-500/30">
                  {clause}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8 relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clauses by keyword or label..."
            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {processedResults.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-lg">No results found for this filter.</p>
            </div>
          ) : (
            processedResults.map((item) => {
              const rootIndex = item.originalIndex
              const isExpanded = expandedItems[rootIndex]
              const clauseText = item.clause || ""
              const clauseTruncated = truncateText(clauseText)

              return (
                <div key={rootIndex} className="group">
                  {/* Clause Card */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition">
                          {item.predicted_label_name}
                        </h3>
                      </div>
                      <RiskIndicator risk={item.risk_level} />
                    </div>

                    {/* Clause Content */}
                    <div className="mb-6 pb-6 border-b border-slate-700">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Detected Clause</p>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {isExpanded ? clauseText : clauseTruncated}
                      </p>
                      {clauseText.length > 150 && (
                        <button
                          onClick={() => toggleExpand(rootIndex)}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium mt-3 transition"
                        >
                          {isExpanded ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>

                    {/* Risk Analysis Summary */}
                    <div className="mb-6 p-5 bg-slate-800/50 border border-slate-700 rounded-lg">
                      <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-3">AI Risk Analysis</p>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                        {item.analysis?.plain_issue_explanation}
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => setExpandedSuggestion(rootIndex)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-lg transition transform hover:scale-105 active:scale-95"
                    >
                      View Full Analysis
                    </button>
                  </div>

                  {/* Suggestion Panel */}
                  <SuggestionPanel
                    item={item}
                    isOpen={expandedSuggestion === rootIndex}
                    onClose={() => setExpandedSuggestion(null)}
                  />
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}