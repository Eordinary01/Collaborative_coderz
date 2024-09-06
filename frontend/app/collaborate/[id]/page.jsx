'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { io } from 'socket.io-client'
import Editor from '@monaco-editor/react'
import { motion } from 'framer-motion'
import { FiSave, FiUsers, FiMessageSquare, FiSettings } from 'react-icons/fi'

export default function Collaborate() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [title, setTitle] = useState('Untitled Project')
  const [collaborators, setCollaborators] = useState([])
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const { id } = useParams()
  const router = useRouter()
  const socketRef = useRef()

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL)
    socketRef.current.emit('joinRoom', id)

    socketRef.current.on('codeUpdate', (updatedCode) => {
      setCode(updatedCode)
    })

    socketRef.current.on('languageUpdate', (updatedLanguage) => {
      setLanguage(updatedLanguage)
    })

    socketRef.current.on('titleUpdate', (updatedTitle) => {
      setTitle(updatedTitle)
    })

    socketRef.current.on('collaboratorUpdate', (updatedCollaborators) => {
      setCollaborators(updatedCollaborators)
    })

    socketRef.current.on('chatMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message])
    })

    // Fetch initial project data
    fetchProjectData()

    return () => {
      socketRef.current.disconnect()
    }
  }, [id])

  const fetchProjectData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/code/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCode(response.data.content)
      setLanguage(response.data.language)
      setTitle(response.data.title)
      setCollaborators(response.data.collaborators || [])
    } catch (error) {
      console.error('Failed to fetch project data', error)
    }
  }

  const handleEditorChange = (value) => {
    setCode(value)
    socketRef.current.emit('codeChange', { roomId: id, code: value })
  }

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value
    setLanguage(newLanguage)
    socketRef.current.emit('languageChange', { roomId: id, language: newLanguage })
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    socketRef.current.emit('titleChange', { roomId: id, title: newTitle })
  }

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/code/${id}`, 
        { content: code, language, title },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Show a success message or notification here
    } catch (error) {
      console.error('Failed to save project', error)
      // Show an error message here
    }
  }

  const sendMessage = () => {
    if (newMessage.trim()) {
      socketRef.current.emit('chatMessage', { roomId: id, message: newMessage })
      setNewMessage('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="text-2xl font-bold bg-transparent border-b border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <div className="flex items-center space-x-4">
            <select
              value={language}
              onChange={handleLanguageChange}
              className="bg-gray-700 rounded px-2 py-1"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="typescript">TypeScript</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full flex items-center space-x-2"
            >
              <FiSave /> <span>Save</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChatOpen(!chatOpen)}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full flex items-center space-x-2"
            >
              <FiMessageSquare /> <span>Chat</span>
            </motion.button>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)]">
        <div className="flex-grow">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 16,
            }}
          />
        </div>

        {chatOpen && (
          <div className="w-80 bg-gray-800 p-4 flex flex-col">
            <h3 className="text-xl font-bold mb-4">Chat</h3>
            <div className="flex-grow overflow-y-auto mb-4">
              {messages.map((msg, index) => (
                <div key={index} className="mb-2">
                  <strong>{msg.user}:</strong> {msg.text}
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-grow bg-gray-700 rounded-l px-2 py-1"
                placeholder="Type a message..."
              />
              <button
                onClick={sendMessage}
                className="bg-blue-500 hover:bg-blue-600 px-4 py-1 rounded-r"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}