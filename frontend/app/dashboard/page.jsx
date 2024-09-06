"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FiPlus,
  FiCode,
  FiCalendar,
  FiSearch,
  FiUser,
  FiStar,
  FiGitBranch,
  FiGrid,
  FiList,
  FiUsers,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import CodeViewer from "../components/CodeViewer";
import { Tooltip } from "react-tooltip";
import io from "socket.io-client";

export default function Dashboard() {
  const [codes, setCodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [selectedCode, setSelectedCode] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState("grid");
  const [userCollaborationCode, setUserCollaborationCode] = useState("");
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [enteredCollabCode, setEnteredCollabCode] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetchCodes();
    fetchUserCollaborationCode();

    const socket = io(process.env.NEXT_PUBLIC_API_URL);
    socket.on("collaborationRequest", handleCollaborationRequest);

    return () => {
      socket.off("collaborationRequest", handleCollaborationRequest);
      socket.disconnect();
    };
  }, []);

  const fetchCodes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/code`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCodes(response.data);
    } catch (error) {
      console.error("Failed to fetch codes", error);
      router.push("/login");
    }
  };

  const fetchUserCollaborationCode = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/collaboration-code`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserCollaborationCode(response.data.collaborationCode);
    } catch (error) {
      console.error("Failed to fetch collaboration code", error);
    }
  };

  const handleCollaborationRequest = (data) => {
    if (window.confirm(`${data.requester} wants to collaborate. Accept?`)) {
      router.push(`/collaborate/${data.id}`);
    }
  };

  const sendCollaborationRequest = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found. Please log in first.");
        return;
      }
  
      if (!enteredCollabCode) {
        alert("Please enter a collaboration code.");
        return;
      }
  
      console.log('Sending collaboration request with code:', enteredCollabCode);
  
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/code/collaborate`,
        { collaborationCode: enteredCollabCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      console.log('Collaboration request response:', response.data);
  
      setShowCollabModal(false);
      setEnteredCollabCode("");
      alert("Collaboration request sent!");
    } catch (error) {
      console.error("Failed to send collaboration request", error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      alert("Failed to send collaboration request: " + (error.response?.data?.error || error.message));
    }
  };

  const filteredCodes = codes
    .filter(
      (code) =>
        code.language.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedLanguage === "All" || code.language === selectedLanguage)
    )
    .sort((a, b) => {
      if (sortBy === "date")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "name") return a.title.localeCompare(b.title);
      return 0;
    });

  const languages = ["All", ...new Set(codes.map((code) => code.language))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <main className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Code Observatory
          </h2>
          <div className="flex items-center space-x-4">
            <div className="bg-gray-700 rounded-full px-4 py-2">
              Your Collaboration Code: {userCollaborationCode}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-2 px-6 rounded-full transition shadow-lg"
              onClick={() => router.push("/collaborate/new")}
            >
              <FiPlus /> <span>New Project</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-2 px-6 rounded-full transition shadow-lg"
              onClick={() => setShowCollabModal(true)}
            >
              <FiUsers /> <span>Collaborate</span>
            </motion.button>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap space-x-4 items-center">
          <div className="relative flex-grow mb-4 md:mb-0">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="bg-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <select
            className="bg-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
          </select>
          <div className="flex space-x-2">
            <button
              className={`p-2 rounded-full ${
                viewMode === "grid" ? "bg-blue-500" : "bg-gray-700"
              }`}
              onClick={() => setViewMode("grid")}
            >
              <FiGrid />
            </button>
            <button
              className={`p-2 rounded-full ${
                viewMode === "list" ? "bg-blue-500" : "bg-gray-700"
              }`}
              onClick={() => setViewMode("list")}
            >
              <FiList />
            </button>
          </div>
        </div>

        <div
          className={`grid ${
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          } gap-6`}
        >
          <AnimatePresence>
            {filteredCodes.map((code) => (
              <motion.div
                key={code._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition"
                onClick={() => setSelectedCode(code)}
              >
                <h3 className="text-xl font-semibold mb-2 hover:text-blue-400 transition">
                  {code.title || "Untitled Project"}
                </h3>
                <div className="flex items-center space-x-2 text-gray-400 mb-2">
                  <FiCode /> <span>{code.language}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 mb-2">
                  <FiCalendar />{" "}
                  <span>{new Date(code.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 mb-4">
                  <FiUser /> <span>{code.author || "Anonymous"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <FiStar className="text-yellow-500" />
                    <span>{code.stars || 0}</span>
                  </div>
                  <div className="flex space-x-2">
                    <FiGitBranch className="text-green-500" />
                    <span>{code.forks || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      <Tooltip id="project-tooltip" />

      {selectedCode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto"
          >
            <CodeViewer
              id={selectedCode._id}
              onClose={() => setSelectedCode(null)}
            />
          </motion.div>
        </motion.div>
      )}

      {showCollabModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Enter Collaboration Code</h3>
            <input
              type="text"
              value={enteredCollabCode}
              onChange={(e) => setEnteredCollabCode(e.target.value)}
              className="w-full bg-gray-700 rounded px-2 py-1 mb-4"
              placeholder="Enter collaboration code"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded"
                onClick={() => {
                  setShowCollabModal(false);
                  setEnteredCollabCode("");
                }}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
                onClick={sendCollaborationRequest}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}