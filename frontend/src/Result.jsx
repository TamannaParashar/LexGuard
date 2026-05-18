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
    { title: "Issue Summary",       icon: "📋", content: item.analysis?.plain_issue_explanation },
    { title: "Why It Matters",      icon: "⚡", content: item.analysis?.why_it_matters },
    { title: "Key Risk Points",     icon: "🚨", content: item.analysis?.quick_risk_points?.join(" • ") },
    { title: "Recommended Fix",     icon: "💡", content: item.analysis?.recommended_fix_summary },
    { title: "Safer Clause Version",icon: "✨", content: item.analysis?.improved_clause_text, copyable: true },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Detailed Analysis</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestions.map((suggestion, i) => (
              <div
                key={i}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{suggestion.icon}</span>
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">{suggestion.title}</h3>
                  </div>
                  {suggestion.copyable && (
                    <button
                      onClick={() => copyToClipboard(suggestion.content, i)}
                      className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-md border transition ${
                        copiedField === i
                          ? 'bg-green-500/20 border-green-500/40 text-green-400'
                          : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white hover:bg-slate-600'
                      }`}
                    >
                      {copiedField === i ? '✓ Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {suggestion.content}
                </p>
              </div>
            ))}
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