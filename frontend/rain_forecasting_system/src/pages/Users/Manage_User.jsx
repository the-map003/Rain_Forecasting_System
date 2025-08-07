import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useUserAuth } from '../../hooks/useUserAuth';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { Edit, Trash2, Check, X, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const Home = () => {
  useUserAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    firstname: '',
    email: '',
    role: 'staff'
  });
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Fetch all users
  const fetchUsers = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL);
      if (response.data) {
        setUsers(response.data);
      } 
    } catch(error) {
      console.log("Failed to fetch users", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    return () => {};
  }, []);

  // Handle checkbox selection
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  // Start editing a user
  const handleEditClick = (user) => {
    setEditingUser(user._id);
    setEditForm({
      firstname: user.firstname,
      email: user.email,
      role: user.role
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({
      firstname: '',
      email: '',
      role: 'staff'
    });
  };

  // Save edited user
  const handleSaveEdit = async (userId) => {
    try {
      const response = await axiosInstance.put(`${API_PATHS.USERS.UPDATE}/${userId}`, editForm);
      if (response.data) {
        toast.success("User updated successfully");
        setUsers(users.map(user => user._id === userId ? { ...user, ...editForm } : user));
        setEditingUser(null);
      }
    } catch (error) {
      console.error("Failed to update user", error);
      toast.error(error.response?.data?.message || "Failed to update user");
    }
  };

  // Confirm delete for a user
  const handleDeleteClick = (userId) => {
    setConfirmDelete(userId);
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  // Delete a user
  const handleConfirmDelete = async (userId) => {
    try {
      await axiosInstance.delete(`${API_PATHS.USERS.DELETE}/${userId}`);
      toast.success("User deleted successfully");
      setUsers(users.filter(user => user._id !== userId));
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Failed to delete user", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  // Delete multiple users
  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      // Create a copy of the selected users array
      const usersToDelete = [...selectedUsers];
      
      // Delete each selected user
      for (const userId of usersToDelete) {
        await axiosInstance.delete(`${API_PATHS.USERS.DELETE}/${userId}`);
        // Remove from users array
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      }
      
      // Clear selected users
      setSelectedUsers([]);
      toast.success(`${usersToDelete.length} user(s) deleted successfully`);
    } catch (error) {
      console.error("Failed to delete selected users", error);
      toast.error("Failed to delete some users");
    }
  };

  return (
    <DashboardLayout activeMenu="UserManagement">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-100">Manage System Users</h1>
            <p className="text-blue-300">Manage system users here.</p>
          </div>
          <div className="flex space-x-4">
            {selectedUsers.length > 0 && (
              <button 
                onClick={handleDeleteSelected}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedUsers.length})
              </button>
            )}
            <button 
              onClick={fetchUsers}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-300"></div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded border-white/30 bg-white/10 focus:ring-blue-500"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={handleSelectAll}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-white/5">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-white/70">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="hover:bg-white/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 rounded border-white/30 bg-white/10 focus:ring-blue-500"
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => handleSelectUser(user._id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser === user._id ? (
                            <input
                              type="text"
                              value={editForm.firstname}
                              onChange={(e) => setEditForm({...editForm, firstname: e.target.value})}
                              className="w-full px-2 py-1 bg-white/20 border border-white/30 rounded text-white"
                            />
                          ) : (
                            <div className="text-white">{user.firstname}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser === user._id ? (
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                              className="w-full px-2 py-1 bg-white/20 border border-white/30 rounded text-white"
                            />
                          ) : (
                            <div className="text-white/80">{user.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser === user._id ? (
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                              className="w-full px-2 py-1 bg-white/20 border border-white/30 rounded text-white"
                            >
                              <option value="admin">Admin</option>
                              <option value="staff">Staff</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/70">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {confirmDelete === user._id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleConfirmDelete(user._id)}
                                className="text-red-400 hover:text-red-300 flex items-center"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Confirm
                              </button>
                              <button
                                onClick={handleCancelDelete}
                                className="text-gray-400 hover:text-gray-300 flex items-center"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </button>
                            </div>
                          ) : editingUser === user._id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSaveEdit(user._id)}
                                className="text-green-400 hover:text-green-300 flex items-center"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-400 hover:text-gray-300 flex items-center"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditClick(user)}
                                className="text-blue-400 hover:text-blue-300 flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(user._id)}
                                className="text-red-400 hover:text-red-300 flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Home;