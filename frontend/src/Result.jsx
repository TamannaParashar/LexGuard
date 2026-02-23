import { useLocation } from "react-router-dom"

export default function Result() {
  const { state } = useLocation()
  const results = state?.result || []

  const getColor = (risk) => {
    if (risk === "high") return "border-red-500 bg-red-500/10"
    if (risk === "medium") return "border-yellow-500 bg-yellow-500/10"
    if (risk === "low") return "border-green-500 bg-green-500/10"
    return "border-gray-500 bg-gray-500/10"
  }

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl font-bold mb-10">Analysis Results</h1>
        <div className="flex gap-6 mb-8">
            <div className="bg-red-500/20 p-4 rounded-xl">
                High Risk: {results.filter(r => r.risk_level === "high").length}
            </div>
            <div className="bg-yellow-500/20 p-4 rounded-xl">
                Medium Risk: {results.filter(r => r.risk_level === "medium").length}
            </div>
            <div className="bg-green-500/20 p-4 rounded-xl">
                Protective: {results.filter(r => r.risk_level === "low").length}
            </div>
        </div>
      <div className="grid grid-cols-2 gap-8">
        
        {/* LEFT: Clauses */}
        <div className="space-y-6">
          {results.map((item, index) => (
            <div key={index} className={`p-4 border rounded-xl ${getColor(item.risk_level)}`}>
              <h3 className="text-sm text-gray-400 mb-2">
                {item.predicted_label_name} ({item.risk_level})
              </h3>
              <p className="text-sm">{item.clause}</p>
            </div>
          ))}
        </div>

        {/* RIGHT: Suggestions */}
        <div className="bg-white/5 border border-blue-500/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Suggestions</h2>
          <p className="text-gray-400">
            AI suggestions for risky clauses will appear here.
          </p>
        </div>

      </div>
    </div>
  )
}