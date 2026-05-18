import React, { useRef, useState } from 'react'
import { Upload, Shield, Zap, CheckCircle, ArrowRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const MAX_FILE_SIZE_MB = 10
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
const ANALYSIS_STEPS = [
  'Extracting text from document...',
  'Classifying clauses with LegalBERT...',
  'Running Gemini AI risk analysis...',
  'Finalizing your report...',
]

export default function Home() {
  const fileInputRef = useRef(null)
  const uploadSectionRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [contractType, setContractType] = useState('SaaS Agreement')
  const [error, setError] = useState(null)
  const [currentStep, setCurrentStep] = useState(-1)

  const navigate = useNavigate()

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only PDF and DOCX files are supported.'
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File size exceeds the ${MAX_FILE_SIZE_MB}MB limit.`
    return null
  }

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { setError(err); return }
    setError(null)
    setSelectedFile(file)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { setError(err); setSelectedFile(null); return }
    setError(null)
    setSelectedFile(file)
  }

  const startProgressSimulation = () => {
    setCurrentStep(0)
    const delays = [3500, 8000, 13000]
    delays.forEach((delay, i) => setTimeout(() => setCurrentStep(i + 1), delay))
  }

  const handleUpload = async () => {
    if (!selectedFile) { setError('Please select a file first.'); return }
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('contract_type', contractType)
    try {
      setLoading(true)
      setError(null)
      startProgressSimulation()
      const response = await fetch('/api/analyze', { method: 'POST', body: formData })
      if (!response.ok) throw new Error(`Server error: ${response.status}`)
      const data = await response.json()
      navigate('/result', { state: data })
    } catch (err) {
      setError('Analysis failed. Please check your file and try again.')
      console.error('Upload failed:', err)
    } finally {
      setLoading(false)
      setCurrentStep(-1)
    }
  }

  const scrollToUpload = () => uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{ animation: 'float 20s infinite ease-in-out', top: '10%', left: '10%' }} />
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{ animation: 'float 25s infinite ease-in-out 2s', top: '50%', right: '10%' }} />
        <div className="absolute w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{ animation: 'float 22s infinite ease-in-out 4s', bottom: '10%', left: '40%' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-blue-500/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">LexGuard</h1>
            </div>
            <nav>
              <button onClick={scrollToUpload} className="text-gray-400 hover:text-white transition">Analyze</button>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight text-balance">
                Analyze Contracts. Detect Risk. Negotiate Smarter.
              </h2>
              <p className="text-xl text-gray-300 mb-8 text-pretty">
                Upload your legal agreements and let AI highlight risks, suggest improvements, and identify strong clauses instantly.
              </p>
              <button onClick={scrollToUpload}
                className="px-8 py-4 border border-blue-500/50 text-white font-semibold rounded-lg hover:bg-blue-500/10 transition">
                Get Started
              </button>
            </div>
            <div className="group relative h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-2xl opacity-60" />
              </div>
              <video src="/homePageVideo.mp4" autoPlay muted loop playsInline
                className="absolute inset-0 w-full h-full object-cover" />
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section ref={uploadSectionRef} id="upload-section" className="max-w-7xl mx-auto px-6 py-16">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              isDragging
                ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                : 'border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/5'
            }`}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Upload Your Contract</h3>
            <p className="text-gray-400 mb-1">Drag and drop your document or click to browse</p>
            <p className="text-sm text-gray-500 mb-6">PDF or DOCX · Max {MAX_FILE_SIZE_MB}MB</p>

            <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleFileSelect} className="hidden" />

            <button onClick={() => fileInputRef.current?.click()}
              className="px-8 py-3 bg-blue-600/20 border border-blue-500/50 text-blue-400 font-semibold rounded-lg hover:bg-blue-600/30 transition mb-4">
              Select File
            </button>

            {/* Selected file pill */}
            {selectedFile && (
              <div className="flex items-center justify-center gap-3 mx-auto max-w-sm mb-4 px-4 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-sm text-blue-300 truncate">{selectedFile.name}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
                </span>
                <button onClick={() => { setSelectedFile(null); setError(null) }}
                  className="text-gray-500 hover:text-red-400 transition flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <br />

            <select value={contractType} onChange={(e) => setContractType(e.target.value)}
              className="mb-6 px-4 py-2 mr-4 bg-black border border-blue-500/50 text-white rounded-lg">
              <option value="SaaS Agreement">SaaS Agreement</option>
              <option value="NDA">NDA</option>
              <option value="Employment Agreement">Employment Agreement</option>
              <option value="Vendor Agreement">Vendor Agreement</option>
            </select>

            <button onClick={handleUpload} disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Analyzing...' : 'Analyze Contract'}
            </button>

            {/* Error banner */}
            {error && (
              <div className="mt-5 mx-auto max-w-md flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Progress steps */}
            {loading && (
              <div className="mt-8 mx-auto max-w-xs space-y-3 text-left">
                {ANALYSIS_STEPS.map((step, i) => {
                  const done = i < currentStep
                  const active = i === currentStep
                  return (
                    <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${done || active ? 'opacity-100' : 'opacity-25'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                        done ? 'bg-green-500 text-white' :
                        active ? 'bg-blue-500 text-white animate-pulse' :
                        'bg-gray-800 border border-gray-700 text-gray-600'
                      }`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={`text-sm ${done ? 'text-green-400' : active ? 'text-white' : 'text-gray-600'}`}>
                        {step}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Icon: Shield, title: 'Risk Detection', desc: 'Automatically highlights high-risk clauses like unlimited liability and unfair termination terms.' },
              { Icon: Zap, title: 'Smart Classification', desc: 'Understands legal sections including indemnity, liability, payment terms, and more.' },
              { Icon: ArrowRight, title: 'AI Suggestions', desc: 'Provides safer alternative wording to improve negotiation outcomes.' },
              { Icon: CheckCircle, title: 'Clause Recognition', desc: 'Identifies well-balanced and protective clauses in your agreement.' },
            ].map(({ Icon, title, desc }, i) => (
              <div key={i} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition blur-xl" />
                <div className="relative bg-white/5 backdrop-blur-sm border border-blue-500/20 rounded-xl p-8 hover:border-blue-500/50 transition h-full">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                  <p className="text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-4xl font-bold text-white text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: 1, title: 'Upload Contract', desc: 'Submit your PDF or DOCX file securely' },
              { n: 2, title: 'AI Analyzes', desc: 'Our AI engine identifies risks and opportunities' },
              { n: 3, title: 'Get Insights', desc: 'Receive a detailed risk report and recommendations' },
            ].map(({ n, title, desc }, i, arr) => (
              <div key={n} className="relative group">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center mb-4 text-white font-bold text-xl group-hover:scale-110 transition">
                    {n}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                  <p className="text-gray-400 text-center">{desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-12 h-1 bg-gradient-to-r from-blue-500 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur-xl" />
            <div className="relative bg-white/5 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Analyze Your Contracts?</h2>
              <p className="text-xl text-gray-300 mb-8">Get started today and detect contract risks with AI-powered precision.</p>
              <button onClick={scrollToUpload}
                className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105">
                Start Analysis Now
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-blue-500/20 mt-24 py-12 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-white font-semibold">LexGuard</span>
            </div>
            <p className="text-gray-500 text-sm">© 2026 LexGuard. All rights reserved.</p>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-30px) translateX(20px); }
          50% { transform: translateY(-60px) translateX(-20px); }
          75% { transform: translateY(-30px) translateX(20px); }
        }
      `}</style>
    </div>
  )
}