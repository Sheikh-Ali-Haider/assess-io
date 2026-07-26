import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../layout/MainLayout';
import { Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../utils/api';

// How many users to show per page
const USERS_PER_PAGE = 10;

export default function UserManagement() {
  const [userList, setUserList]           = useState([]);
  const [filterRole, setFilterRole]       = useState('all');
  const [searchQuery, setSearchQuery]     = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser]     = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors]               = useState([]);
  const [loading, setLoading]             = useState(true);

  const [formData, setFormData] = useState({
    name:           '',
    email:          '',
    role:           'student',
    password:       '',
    department:     '',
    specialization: '',
    matric_number:  '',
  });

  // Fetch all users when the page first loads
  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset to page 1 whenever search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUserList(data);
    } catch (err) {
      setErrors(['Failed to load users']);
    } finally {
      setLoading(false);
    }
  };

  // First filter by role, then filter by search query (name or email)
  const filteredUsers = userList
    .filter((u) => filterRole === 'all' || u.role === filterRole)
    .filter((u) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    });

  // Pagination calculations
  const totalPages   = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const startIndex   = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex     = startIndex + USERS_PER_PAGE;
  const pagedUsers   = filteredUsers.slice(startIndex, endIndex);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors([]);
  };

  const validateForm = () => {
    const newErrors = [];
    if (!formData.name.trim())  newErrors.push('Name is required');
    if (!formData.email.trim()) newErrors.push('Email is required');
    if (!editingUser && !formData.password.trim()) newErrors.push('Password is required');
    if (formData.role === 'teacher' && !formData.department.trim()) {
      newErrors.push('Department is required for teachers');
    }
    if (formData.role === 'student' && !formData.matric_number.trim()) {
      newErrors.push('Matric number is required for students');
    }
    return newErrors;
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editingUser) {
        const updated = await updateUser(editingUser.id, formData);
        setUserList(userList.map((u) => (u.id === editingUser.id ? updated : u)));
        setSuccessMessage('User updated successfully!');
      } else {
        const newUser = await createUser(formData);
        setUserList([...userList, newUser]);
        setSuccessMessage('User added successfully!');
      }
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrors([err.message || 'Something went wrong']);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name:           user.name,
      email:          user.email,
      role:           user.role,
      password:       '',
      department:     user.department     || '',
      specialization: user.specialization || '',
      matric_number:  user.matric_number  || '',
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        setUserList(userList.filter((u) => u.id !== userId));
        setSuccessMessage('User deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setErrors([err.message || 'Failed to delete user']);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name:           '',
      email:          '',
      role:           'student',
      password:       '',
      department:     '',
      specialization: '',
      matric_number:  '',
    });
    setEditingUser(null);
    setIsAddModalOpen(false);
    setErrors([]);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':   return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'student': return 'bg-blue-100 text-blue-800';
      default:        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 text-center text-gray-500">Loading users...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-6 lg:p-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">User Management</h2>
            <p className="text-sm text-gray-500">Add, edit, and manage system users</p>
          </div>
          <button
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition font-semibold text-sm w-full sm:w-auto justify-center"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="font-semibold text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Error messages */}
        {errors.length > 0 && (
          <div className="mb-6 space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="p-3 bg-red-100 border border-red-400 rounded-lg flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters row: role filter buttons + search bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">

          {/* Role filter buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-600">Filter by role:</span>
            {['all', 'admin', 'teacher', 'student'].map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterRole === role
                    ? 'bg-primary-blue text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {role === 'all' ? 'All Users' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>

          {/* Search bar - grows to fill remaining space */}
          <div className="relative sm:ml-auto w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue bg-white"
            />
          </div>
        </div>

        {/* Users table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-500 text-sm">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department / Matric</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition">

                        {/* Name - left aligned, matches header */}
                        <td className="px-4 py-3 text-left">
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        </td>

                        {/* Email - left aligned, matches header */}
                        <td className="px-4 py-3 text-left">
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </td>

                        {/* Role badge - left aligned, matches header */}
                        <td className="px-4 py-3 text-left">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>

                        {/* Department or matric - left aligned, dash centered if empty */}
                        <td className="px-4 py-3 text-left">
                          {user.department || user.matric_number ? (
                            <p className="text-sm text-gray-600">
                              {user.department || user.matric_number}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 text-center">—</p>
                          )}
                        </td>

                        {/* Action buttons - ghost style, color appears on hover */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-gray-400 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition"
                              title="Edit"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50">

                {/* Entry count info */}
                <p className="text-sm text-gray-500">
                  Showing{' '}
                  <span className="font-medium text-gray-700">{startIndex + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium text-gray-700">
                    {Math.min(endIndex, filteredUsers.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium text-gray-700">{filteredUsers.length}</span>
                  {' '}entries
                </p>

                {/* Previous / Next buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>

                  {/* Page number pills */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 text-sm font-medium rounded-lg transition ${
                          currentPage === page
                            ? 'bg-primary-blue text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Add / Edit user modal - no functionality changed */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

              {/* Modal header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <X size={22} />
                </button>
              </div>

              {/* Modal form - no changes to fields or validation */}
              <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                {errors.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {errors.map((error, index) => (
                      <div key={index} className="p-3 bg-red-100 border border-red-400 rounded-lg flex items-start gap-2">
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Full Name *</label>
                  <input
                    type="text" name="name" value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue text-sm"
                    placeholder="e.g., John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Email *</label>
                  <input
                    type="email" name="email" value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue text-sm"
                    placeholder="e.g., john@university.edu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password" name="password" value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Role *</label>
                  <select
                    name="role" value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue text-sm"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {formData.role === 'teacher' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Department *</label>
                      <input
                        type="text" name="department" value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue text-sm"
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Specialization</label>
                      <input
                        type="text" name="specialization" value={formData.specialization}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue text-sm"
                        placeholder="e.g., Machine Learning"
                      />
                    </div>
                  </>
                )}

                {formData.role === 'student' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Matric Number *</label>
                    <input
                      type="text" name="matric_number" value={formData.matric_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue text-sm"
                      placeholder="e.g., STU007"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary-blue text-white rounded-lg font-semibold hover:bg-opacity-90 transition text-sm"
                  >
                    {editingUser ? 'Update User' : 'Add User'}
                  </button>
                  <button
                    type="button" onClick={resetForm}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
