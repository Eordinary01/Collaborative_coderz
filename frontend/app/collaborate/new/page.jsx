'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Editor from '@monaco-editor/react'
import { motion } from 'framer-motion'
import { FiSave, FiCode, FiX, FiArrowLeft, FiInfo } from 'react-icons/fi'
import { Tooltip } from 'react-tooltip'

export default function NewCode() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/code`,
        { content: code, language, title },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to create new code', error)
      alert('Failed to create new project. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Create New Project
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-700 text-white rounded-full flex items-center space-x-2 hover:bg-gray-600 transition"
          >
            <FiArrowLeft /> <span>Back to Dashboard</span>
          </motion.button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Project Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Enter project title"
                required
              />
            </div>
            <div className="w-1/3">
              <label htmlFor="language" className="block text-sm font-medium mb-2">
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="typescript">TypeScript</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          </div>
          <div className="relative">
            <Editor
              height="60vh"
              language={language}
              value={code}
              onChange={setCode}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 16,
                scrollBeyondLastLine: false,
                roundedSelection: false,
                padding: { top: 16 },
              }}
              className="rounded-lg overflow-hidden shadow-lg"
            />
            <div className="absolute top-2 right-2 bg-gray-800 rounded-full p-2">
              <FiCode className="text-blue-400" size={24} />
            </div>
            <div className="absolute bottom-2 right-2 text-gray-400 text-sm">
              {code.split('\n').length} lines
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-gray-400">
              <FiInfo size={18} />
              <span>Your project will be private by default</span>
            </div>
            <div className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 bg-gray-600 text-white rounded-full flex items-center space-x-2 hover:bg-gray-500 transition"
              >
                <FiX /> <span>Cancel</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center space-x-2 hover:from-blue-600 hover:to-purple-700 transition"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FiSave /> <span>Create Project</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </div>
      <Tooltip id="new-code-tooltip" />
    </div>
  )
}