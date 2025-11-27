import React, { useState, useEffect } from "react";
import { Eye, Check, X, Search } from "lucide-react";

import { API_BASE } from "../config";

const USERS_PER_PAGE = 10;
const ALL_SUBJECTS = ["React", "Node.js", "Marketing", "Design"];
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

const Modal = ({ onClose, children }) => (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 md:p-8 relative transform transition-all duration-300 scale-100 opacity-100"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
        title="Close"
      >
        <X size={24} />
      </button>
      {children}
    </div>
  </div>
);

export default function ApproveMentors() {
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("All");

  // Fetch mentors from backend
  useEffect(() => {
    fetch(`${API_BASE}/api/mentors/getMentors`) // Lavalust endpoint
      .then((res) => res.json())
      .then((data) => setMentors(data))
      .catch((err) => console.error("Failed to fetch mentors:", err));
  }, []);

  // Approve or Reject mentor
  const handleStatusChange = (id, status) => {
    const action = status === "active" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${action} this mentor?`))
      return;

    fetch(`${API_BASE}/api/mentors/${id}/${action}`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        setMentors((prev) => prev.filter((m) => m.id !== id));
        if (selectedMentor?.id === id) setSelectedMentor(null);
      })
      .catch((err) => console.error(err));
  };

  // Filter and search mentors
  const filteredAndSearchedMentors = mentors.filter((mentor) => {
    const searchMatch =
      mentor.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const subjectMatch =
      filterSubject === "All" ||
      (mentor.subjects && mentor.subjects.includes(filterSubject));
    return searchMatch && subjectMatch;
  });

  const totalMentors = filteredAndSearchedMentors.length;
  const totalPages = Math.ceil(totalMentors / USERS_PER_PAGE);
  const startIdx = (currentPage - 1) * USERS_PER_PAGE;
  const endIdx = Math.min(startIdx + USERS_PER_PAGE, totalMentors);
  const currentMentors = filteredAndSearchedMentors.slice(startIdx, endIdx);

  useEffect(() => setCurrentPage(1), [searchTerm, filterSubject]);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <div className="min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 border-b pb-4">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Mentor Application Review
          </h1>
          <p className="text-gray-500 mt-2">
            Efficiently manage pending mentor applications.
          </p>
        </div>

        {mentors.length === 0 ? (
          <div className="bg-white shadow-lg rounded-xl p-10 text-center border border-green-200">
            <div className="text-green-500 text-5xl mb-4 font-bold">✓</div>
            <h2 className="font-semibold text-2xl text-gray-800 mb-2">
              All Clear!
            </h2>
            <p className="text-gray-500">
              There are no pending mentor applications to review at this time.
            </p>
          </div>
        ) : (
          <>
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white shadow-md rounded-xl">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Name or Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                />
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="subject-filter"
                  className="text-gray-600 whitespace-nowrap text-sm"
                >
                  Filter by Subject:
                </label>
                <select
                  id="subject-filter"
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="py-2 px-4 border border-gray-300 rounded-lg bg-white appearance-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                >
                  <option value="All">All Subjects ({mentors.length})</option>
                  {ALL_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-black">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-xl">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider rounded-tr-xl">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentMentors.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-8 text-center text-gray-500 italic"
                      >
                        No mentors match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    currentMentors.map((mentor) => (
                      <tr
                        key={mentor.id}
                        className="hover:bg-indigo-50/50 transition duration-150"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {mentor.first_name} {mentor.last_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {mentor.email}
                        </td>
                        <td className="px-4 py-3">
                          {mentor.subjects?.map((s, idx) => (
                            <span
                              key={idx}
                              className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full mr-1 whitespace-nowrap font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-sm whitespace-nowrap">
                          {formatDate(mentor.date_joined)}
                        </td>
                        <td className="px-4 py-3 flex justify-center items-center gap-2">
                          <button
                            onClick={() => setSelectedMentor(mentor)}
                            className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 hover:shadow transition duration-150"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(mentor.id, "active")
                            }
                            className="px-3 py-1 rounded-md bg-green-500 text-white text-sm hover:bg-green-600 shadow-md hover:shadow-lg transition duration-150 flex items-center gap-1 font-semibold"
                          >
                            <Check size={16} /> Approve
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(mentor.id, "inactive")
                            }
                            className="px-3 py-1 rounded-md bg-red-500 text-white text-sm hover:bg-red-600 shadow-md hover:shadow-lg transition duration-150 flex items-center gap-1 font-semibold"
                          >
                            <X size={16} /> Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4 text-gray-600 text-sm">
              <div>
                Showing {startIdx + 1}–{endIdx} of {totalMentors} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded border ${
                    currentPage === 1
                      ? "bg-gray-200 cursor-not-allowed"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  Prev
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded border ${
                    currentPage === totalPages
                      ? "bg-gray-200 cursor-not-allowed"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {/* Mentor Modal */}
        {selectedMentor && (
          <Modal onClose={() => setSelectedMentor(null)}>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto flex items-center justify-center rounded-full bg-indigo-500 text-white text-4xl font-extrabold mb-4 shadow-xl">
                {selectedMentor.first_name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {selectedMentor.first_name} {selectedMentor.last_name}
              </h2>
              <p className="text-indigo-600 mb-4">{selectedMentor.email}</p>

              <div className="text-left mb-6 p-5 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-base font-semibold text-indigo-700 mb-2">
                  Application Details
                </p>
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Bio:</p>
                  <p className="text-gray-600 italic text-sm">
                    {selectedMentor.bio || "No bio provided."}
                  </p>
                </div>
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Subjects:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedMentor.subjects?.map((s, idx) => (
                      <span
                        key={idx}
                        className="bg-indigo-200 text-indigo-800 text-xs px-3 py-1 rounded-full font-medium shadow-sm"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-xs mb-6">
                Applied on: {formatDate(selectedMentor.date_joined)}
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() =>
                    handleStatusChange(selectedMentor.id, "active")
                  }
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-150 shadow-lg flex items-center gap-2 font-bold"
                >
                  <Check size={20} /> Approve
                </button>
                <button
                  onClick={() =>
                    handleStatusChange(selectedMentor.id, "inactive")
                  }
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-150 shadow-lg flex items-center gap-2 font-bold"
                >
                  <X size={20} /> Reject
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
