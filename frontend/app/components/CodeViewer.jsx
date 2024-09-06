import { useState, useEffect } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { FiCode, FiCalendar, FiUsers, FiX, FiPlay, FiCopy } from "react-icons/fi";
import { motion } from "framer-motion";

export default function CodeViewer({ id, onClose }) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [projectInfo, setProjectInfo] = useState({});
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCode = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/code/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCode(response.data.content);
        setLanguage(response.data.language);
        setProjectInfo({
          owner: response.data.user.username || "Unknown User",
          title: response.data.title || "Untitled Project",
          createdAt: new Date(response.data.createdAt).toLocaleDateString(),
          collaborators: response.data.collaborators
            ? response.data.collaborators.length
            : 1,
        });
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch code", error);
        setIsLoading(false);
      }
    };

    fetchCode();
  }, [id]);

  const runCode = async () => {
    try {
      setOutput("Running code...");
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/code/run/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOutput(response.data.output || "No output");
    } catch (error) {
      console.error("Failed to run code", error.response?.data || error);
      setOutput(JSON.stringify(error.response?.data || error.message, null, 2));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      alert("Code copied to clipboard!");
    });
  };

  if (isLoading) {
    return <div className="text-white text-center">Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-900 text-white p-6 rounded-lg shadow-lg relative"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
      >
        <FiX size={24} />
      </button>
      <h2 className="text-3xl font-bold mb-4 pr-8">{projectInfo.title}</h2>
      <p className="mb-2 text-blue-400">Owner: {projectInfo.owner}</p>
      <div className="flex flex-wrap items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2 text-gray-300">
          <FiCode />
          <span>{language}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-300">
          <FiCalendar />
          <span>{projectInfo.createdAt}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-300">
          <FiUsers />
          <span>{projectInfo.collaborators} collaborators</span>
        </div>
      </div>
      <div className="relative">
        <Editor
          height="50vh"
          language={language}
          value={code}
          theme="vs-dark"
          options={{ readOnly: true, minimap: { enabled: false } }}
        />
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 bg-gray-700 p-2 rounded-full hover:bg-gray-600 transition"
          title="Copy code"
        >
          <FiCopy />
        </button>
      </div>
      <div className="mt-4 flex space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-green-500 text-white rounded-full flex items-center space-x-2"
          onClick={runCode}
        >
          <FiPlay />
          <span>Run Code</span>
        </motion.button>
      </div>
      {output && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-gray-800 rounded"
        >
          <h3 className="text-lg font-bold mb-2">Output:</h3>
          <pre className="whitespace-pre-wrap break-words">{output}</pre>
        </motion.div>
      )}
    </motion.div>
  );
}