import { useLocation } from "react-router-dom"
import { useState } from "react"

export default function Result() {
  const { state } = useLocation()
  const results = state?.result || []
  const [expandedItems, setExpandedItems] = useState({})

  const toggleExpand = (index, section) => {
    const key = `${index}-${section}`
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const truncateText = (text, limit = 150) => {
    if (!text) return ""
    return text.length > limit ? text.substring(0, limit) + "..." : text
  }

  const getColor = (risk) => {
    if (risk === "high") return "border-red-500/50 bg-red-500/10 hover:bg-red-500/20"
    if (risk === "medium") return "border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20"
    if (risk === "low") return "border-green-500/50 bg-green-500/10 hover:bg-green-500/20"
    return "border-gray-500/50 bg-gray-500/10"
  }

  const getRiskBadge = (risk) => {
    if (risk === "high") return "bg-red-500/20 text-red-300 border border-red-500/50"
    if (risk === "medium") return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
    if (risk === "low") return "bg-green-500/20 text-green-300 border border-green-500/50"
    return "bg-gray-500/20 text-gray-300"
  }

  const highRiskCount = results.filter(r => r.risk_level === "high").length
  const mediumRiskCount = results.filter(r => r.risk_level === "medium").length
  const lowRiskCount = results.filter(r => r.risk_level === "low").length

  return (
    <div className="min-h-screen bg-black  text-white p-6 md:p-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-4xl font-bold mb-2">Analysis Results</h1>
        <p className="text-gray-400">Review detected clauses and AI-powered suggestions</p>
      </div>
      {/* Contract Overview */}
      <div className="mb-10 bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          📄 Contract Overview
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Contract Type */}
          <div>
            <p className="text-sm text-gray-400">Contract Type</p>
            <p className="text-lg font-semibold text-white">
              {state?.contract_type}
            </p>
          </div>

          {/* Coverage Score */}
          <div>
            <p className="text-sm text-gray-400">Clause Coverage</p>
            <p className="text-lg font-semibold text-blue-400">
              {state?.coverage_score}%
            </p>
          </div>

          {/* Total Clauses */}
          <div>
            <p className="text-sm text-gray-400">Total Clauses Detected</p>
            <p className="text-lg font-semibold text-white">
              {state?.total_clauses}
            </p>
          </div>
        </div>
      </div>
      {/* Coverage Progress Bar */}
        <div className="mb-10">
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
              style={{ width: `${state?.coverage_score || 0}%` }}
            />
          </div>
        </div>
        {/* Missing Clauses */}
                {state?.missing_clauses?.length > 0 && (
                  <div className="mb-10 bg-red-500/5 border border-red-500/30 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-red-400 mb-4">
                      ⚠️ Missing Important Clauses
                    </h2>

                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-2">
                      {state.missing_clauses.map((clause, index) => (
                        <li key={index}>{clause}</li>
                      ))}
                    </ul>

                    <p className="text-xs text-gray-400 mt-4">
                      These clauses are typically expected in a {state.contract_type}.
                      Their absence may expose the business to risk.
                    </p>
                  </div>
                )}
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-5 hover:bg-red-500/15 transition">
          <div className="text-3xl font-bold text-red-400">{highRiskCount}</div>
          <p className="text-gray-300 text-sm mt-1">High Risk</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-5 hover:bg-yellow-500/15 transition">
          <div className="text-3xl font-bold text-yellow-400">{mediumRiskCount}</div>
          <p className="text-gray-300 text-sm mt-1">Medium Risk</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-5 hover:bg-green-500/15 transition">
          <div className="text-3xl font-bold text-green-400">{lowRiskCount}</div>
          <p className="text-gray-300 text-sm mt-1">Protective</p>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No results found</p>
          </div>
        ) : (
          results.map((item, index) => {
            const clauseKey = `${index}-clause`
            const isClauseExpanded = expandedItems[clauseKey]
            const clauseText = item.clause || ""
            const clauseTruncated = truncateText(clauseText)

            return (
              <div
                key={index}
                className={`border rounded-lg p-5 transition ${getColor(item.risk_level)}`}
              >
                {/* Header with Risk Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {item.predicted_label_name}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getRiskBadge(item.risk_level)}`}>
                    {item.risk_level.charAt(0).toUpperCase() + item.risk_level.slice(1)} Risk
                  </span>
                </div>
                {/* Clause Section */}
                <div className="mb-4 pb-4 border-b border-white/10">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Detected Clause
                  </p>
                  <p className="text-gray-200 text-sm leading-relaxed">
                    {isClauseExpanded ? clauseText : clauseTruncated}
                  </p>
                  {clauseText.length > 150 && (
                    <button
                      onClick={() => toggleExpand(index, "clause")}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium mt-2 transition"
                    >
                      {isClauseExpanded ? "Show less" : "Read more..."}
                    </button>
                  )}
                </div>

                {/* AI Analysis Section */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-green-400 uppercase tracking-wide">
                    AI Risk Analysis
                  </p>

                  <div className="bg-white/5 rounded-lg p-5 space-y-5 border border-white/10">

                    {/* Summary */}
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">
                        📌 Executive Summary
                      </p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {item.analysis?.summary}
                      </p>
                    </div>

                    {/* Why Risky */}
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">
                        🚨 Why This Is Risky
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                        {item.analysis?.why_risky?.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Business Impact */}
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">
                        💼 Business Impact
                      </p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {item.analysis?.business_impact}
                      </p>
                    </div>

                    {/* Recommendation */}
                    <div className="bg-green-500/5 border border-green-500/30 rounded-md p-4">
                      <p className="text-sm font-semibold text-green-400 mb-1">
                        ✅ Recommended Revision
                      </p>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                        {item.analysis?.recommended_revision}
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
