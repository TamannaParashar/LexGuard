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
            const suggestionKey = `${index}-suggestion`
            const isClauseExpanded = expandedItems[clauseKey]
            const isSuggestionExpanded = expandedItems[suggestionKey]
            
            const clauseText = item.clause || ""
            const suggestionText = item.ai_suggestion || ""
            const clauseTruncated = truncateText(clauseText)
            const suggestionTruncated = truncateText(suggestionText)

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

                {/* Suggestion Section */}
                <div>
                  <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">
                    💡 AI Suggestion
                  </p>
                  <p className="text-gray-200 text-sm leading-relaxed">
                    {isSuggestionExpanded ? suggestionText : suggestionTruncated}
                  </p>
                  {suggestionText.length > 150 && (
                    <button
                      onClick={() => toggleExpand(index, "suggestion")}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium mt-2 transition"
                    >
                      {isSuggestionExpanded ? "Show less" : "Read more..."}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
