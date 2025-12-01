import React, { useState, useEffect, useCallback } from "react";
import ModalCreateGroup from "../components/ModalCreateGroup";
import GroupCard from "../components/GroupCard";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { API_BASE } from "../config";

const API_URL = `${API_BASE}/api/groups`;
const MEMBER_URL = `${API_BASE}/api/members`;

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [deleteGroup, setDeleteGroup] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [groupActionLoading, setGroupActionLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const userRole = localStorage.getItem("user_role");

  // Fetch all groups and their members
  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      // Fetch members for each group
      const groupsWithMembers = await Promise.all(
        data.map(async (g) => {
          const resMembers = await fetch(`${API_URL}/view/${g.id}`);
          if (!resMembers.ok) throw new Error("Failed to fetch group members");
          const groupData = await resMembers.json();
          const members = groupData.members || [];
          const joined =
            members.some((m) => m.user_id === user?.id) ||
            g.instructor_id === user?.id;
          return {
            ...g,
            members,
            joined,
            member_count: members.length,
          };
        })
      );

      setGroups(groupsWithMembers);
      setError(null);
    } catch (err) {
      console.error("Fetch groups error:", err);
      setError(err.message);
      toast.error(`Failed to fetch groups: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Save or update group
  const handleSaveGroup = async (groupData) => {
    if (!user?.id) return toast.error("User not logged in");
    if (actionLoading) return;

    setActionLoading(true);
    try {
      const method = editingGroup ? "PUT" : "POST";
      const url = editingGroup ? `${API_URL}/${editingGroup.id}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...groupData,
          instructor_id: user.id,
          user_id: user.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      await fetchGroups();
      setShowModal(false);
      setEditingGroup(null);
      toast.success(editingGroup ? "Group updated!" : "Group created!");
    } catch (err) {
      console.error("Save group error:", err);
      toast.error(`Error saving group: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete group
  const handleDeleteGroup = async () => {
    if (!deleteGroup) return;
    if (actionLoading) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/${deleteGroup.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete group");
      }

      setGroups((prev) => prev.filter((g) => g.id !== deleteGroup.id));
      toast.success("Group deleted!");
      setDeleteGroup(null);
    } catch (err) {
      console.error("Delete group error:", err);
      toast.error(`Error deleting group: ${err.message}`);
      setDeleteGroup(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Join group
 
   // Join group
   const handleJoin = async (group) => {
     if (!user?.id) return toast.error("Please login to join a group");
     if (groupActionLoading[group.id]) return;
 
     setGroupActionLoading((prev) => ({ ...prev, [group.id]: true }));
     try {
       const res = await fetch(`${MEMBER_URL}`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ group_id: group.id, user_id: user.id }),
       });
 
       if (!res.ok) {
         const errorData = await res.json();
         throw new Error(errorData.error || "Failed to join group");
       }
 
       await fetchGroups();
       toast.success("Successfully joined the group!");
     } catch (err) {
       console.error("Join error:", err);
       toast.error(`Error joining group: ${err.message}`);
     } finally {
       setGroupActionLoading((prev) => ({ ...prev, [group.id]: false }));
     }
   };
 

  // Leave group
  const handleLeave = async (group) => {
    if (!user?.id) return toast.error("Please login to leave a group");

    const groupMember = group.members?.find((m) => m.user_id === user.id);
    if (!groupMember) return toast.error("You are not a member of this group");

    if (!window.confirm(`Are you sure you want to leave "${group.name}"?`))
      return;

    if (groupActionLoading[group.id]) return;
    setGroupActionLoading((prev) => ({ ...prev, [group.id]: true }));

    try {
      const res = await fetch(`${MEMBER_URL}/${groupMember.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          throw new Error(
            `Server returned non-JSON response (status ${res.status})`
          );
        }
        throw new Error(errorData.error || "Failed to leave group");
      }

      await fetchGroups();
      toast.success("Successfully left the group!");
    } catch (err) {
      console.error("Leave error:", err);
      toast.error(`Error leaving group: ${err.message}`);
    } finally {
      setGroupActionLoading((prev) => ({ ...prev, [group.id]: false }));
    }
  };

  // Navigate to group page
  const handleEnter = (group) => navigate(`/group/${group.id}`);

  // Derived group lists
  const myGroups = groups.filter(
    (g) => g.joined || g.instructor_id === user?.id
  );
  const availableGroups = groups.filter(
    (g) => !g.joined && g.instructor_id !== user?.id
  );

  // Filtered lists for search
  const filteredMyGroups = myGroups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAvailableGroups = availableGroups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading groups...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Error: {error}</p>
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ToastContainer />

      {/* Header and search */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Study Groups</h1>
        <p className="text-gray-600">Collaborate and learn together</p>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          {(userRole === "Mentor" || userRole === "Admin") && (
            <button
              disabled={actionLoading}
              onClick={() => {
                setEditingGroup(null);
                setShowModal(true);
              }}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg ${
                actionLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              + Create New Group
            </button>
          )}
        </div>
      </div>

      {/* My / Joined Groups */}
      <div className="bg-white rounded-2xl shadow p-5 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {userRole === "Mentor" || userRole === "Admin"
            ? "My Groups"
            : "Joined Groups"}
        </h2>
        {filteredMyGroups.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            📚 No groups found.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMyGroups.map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                user={user}
                onEnter={() => handleEnter(g)}
                onEdit={() => {
                  setEditingGroup(g);
                  setShowModal(true);
                }}
                onDelete={() => setDeleteGroup(g)}
                onLeave={() => handleLeave(g)}
                loading={groupActionLoading[g.id] || false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Available Groups */}
      {filteredAvailableGroups.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-xl font-semibold mb-4">Available Groups</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAvailableGroups.map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                user={user}
                onJoin={() => handleJoin(g)}
                loading={groupActionLoading[g.id] || false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ModalCreateGroup
          onClose={() => {
            setShowModal(false);
            setEditingGroup(null);
          }}
          onSave={handleSaveGroup}
          initialData={editingGroup}
          loading={actionLoading}
        />
      )}

      {/* Delete Confirmation */}
      {deleteGroup && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete{" "}
              <span className="font-bold text-red-400">
                "{deleteGroup.name}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                onClick={() => setDeleteGroup(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeleteGroup}
                disabled={actionLoading}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
