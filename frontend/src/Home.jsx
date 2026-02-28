import React, { useRef, useState } from 'react'
import { Upload, Shield, Zap, CheckCircle, ArrowRight } from 'lucide-react'
import {useNavigate} from 'react-router-dom'

export default function Home() {
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [contractType, setContractType] = useState("SaaS Agreement")

  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        console.log('File dropped:', file.name)
      }
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      console.log('File selected:', files[0].name)
      setSelectedFile(files[0])
    }
  }

  const handleUpload = async () => {
  if (!selectedFile) {
    alert("Please select a file first.")
    return
  }

  const formData = new FormData()
  formData.append("file", selectedFile);
  formData.append("contract_type",contractType);

  try {
    setLoading(true)

    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData
    })

    const data = await response.json()
    console.log("Backend response:", data)
    navigate('/result',{state:data})

  } catch (error) {
    console.error("Upload failed:", error)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated Floating Blobs Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Blob 1 - Blue */}
        <div
          className="absolute w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            animation: 'float 20s infinite ease-in-out',
            top: '10%',
            left: '10%',
          }}
        />
        {/* Blob 2 - Purple */}
        <div
          className="absolute w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            animation: 'float 25s infinite ease-in-out 2s',
            top: '50%',
            right: '10%',
          }}
        />
        {/* Blob 3 - Blue-Indigo */}
        <div
          className="absolute w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            animation: 'float 22s infinite ease-in-out 4s',
            bottom: '10%',
            left: '40%',
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black pointer-events-none" />
      </div>

      {/* Content */}
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
            <nav className="flex gap-8">
              <a href="#" className="text-gray-400 hover:text-white transition">About</a>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight text-balance">
                Analyze Contracts. Detect Risk. Negotiate Smarter.
              </h2>
              <p className="text-xl text-gray-300 mb-8 text-pretty">
                Upload your investment agreements and let AI highlight risks, suggest improvements, and identify strong clauses instantly.
              </p>
              <div className="flex gap-4">
                <button className="px-8 py-4 border border-blue-500/50 text-white font-semibold rounded-lg hover:bg-blue-500/10 transition">
                  Learn More
                </button>
              </div>
            </div>
            <div className="group relative h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm overflow-hidden">

            {/* Background Glow */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-2xl opacity-60" />
            </div>
            {/* Video */}
            <video src="/homePageVideo.mp4" autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:opacity-100"/>
            </div>
          </div>
        </section>
        {/* Upload Section */}
        <section className="max-w-7xl mx-auto px-6 py-16">
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
            <p className="text-gray-400 mb-6">Drag and drop your document or click to browse</p>
            <p className="text-sm text-gray-500 mb-6">Supported formats: PDF, DOCX</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-3 bg-blue-600/20 border border-blue-500/50 text-blue-400 font-semibold rounded-lg hover:bg-blue-600/30 transition mb-6"
            >
              Select File
            </button>
            <br />
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="mb-6 px-4 py-2 mr-6 bg-black border border-blue-500/50 text-white rounded-lg"
            >
              <option value="SaaS Agreement">SaaS Agreement</option>
              <option value="NDA">NDA</option>
              <option value="Employment Agreement">Employment Agreement</option>
              <option value="Vendor Agreement">Vendor Agreement</option>
            </select>
            <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition" onClick={handleUpload}>
              {loading?"Analyzing...":"Analyze Contract"}
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition blur-xl" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-blue-500/20 rounded-xl p-8 hover:border-blue-500/50 transition h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Risk Detection</h3>
                <p className="text-gray-400">Automatically highlights high-risk clauses like unlimited liability and unfair termination terms.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition blur-xl" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-blue-500/20 rounded-xl p-8 hover:border-blue-500/50 transition h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Smart Classification</h3>
                <p className="text-gray-400">Understands legal sections including indemnity, liability, payment terms, and more.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition blur-xl" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-blue-500/20 rounded-xl p-8 hover:border-blue-500/50 transition h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">AI Suggestions</h3>
                <p className="text-gray-400">Provides safer alternative wording to improve negotiation outcomes.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition blur-xl" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-blue-500/20 rounded-xl p-8 hover:border-blue-500/50 transition h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Strong Clause Recognition</h3>
                <p className="text-gray-400">Identifies well-balanced and protective clauses in your agreement.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-4xl font-bold text-white text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center mb-4 text-white font-bold text-xl group-hover:scale-110 transition">
                  1
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Upload Contract</h3>
                <p className="text-gray-400 text-center">Submit your PDF or DOCX file securely</p>
              </div>
              {/* Arrow to next step */}
              <div className="hidden md:block absolute top-8 left-full w-12 h-1 bg-gradient-to-r from-blue-500 to-transparent" />
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center mb-4 text-white font-bold text-xl group-hover:scale-110 transition">
                  2
                </div>
                <h3 className="text-xl font-bold text-white mb-3">AI Analyzes</h3>
                <p className="text-gray-400 text-center">Our AI engine identifies risks and opportunities</p>
              </div>
              {/* Arrow to next step */}
              <div className="hidden md:block absolute top-8 left-full w-12 h-1 bg-gradient-to-r from-blue-500 to-transparent" />
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center mb-4 text-white font-bold text-xl group-hover:scale-110 transition">
                  3
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Get Insights</h3>
                <p className="text-gray-400 text-center">Receive detailed risk report and recommendations</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur-xl" />
            <div className="relative bg-white/5 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Analyze Your Contracts?</h2>
              <p className="text-xl text-gray-300 mb-8">Get started today and detect contract risks with AI-powered precision.</p>
              <button className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105">
                Start Analysis Now
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-blue-500/20 mt-24 py-12 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-2 mb-6 md:mb-0">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold">LexGuard</span>
              </div>
              <p className="text-gray-500 text-sm mt-6 md:mt-0">© 2026 LexGuard. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-30px) translateX(20px);
          }
          50% {
            transform: translateY(-60px) translateX(-20px);
          }
          75% {
            transform: translateY(-30px) translateX(20px);
          }
        }
      `}</style>
    </div>
  )
}