import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from './api';
import './AdminDashboard.css'; // Make sure to create this CSS file

const UserManagement = () => {
  const API_URL = API_CONFIG.BASE_URL;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userFormData, setUserFormData] = useState({ 
    name: "", 
    email: "",
    role: "inspector", 
    department: "", 
    expertise: [],
    phoneNumber: "",
    password: "",
    isActive: true
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch all users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle user form submission
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/users`, userFormData);
      
      // Refresh user list
      fetchUsers();
      
      // Close modal and reset form
      setShowUserModal(false);
      setUserFormData({ 
        name: "", 
        email: "",
        role: "inspector", 
        department: "", 
        expertise: [],
        phoneNumber: "",
        password: "",
        isActive: true
      });
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle input changes in the user form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserFormData({
      ...userFormData,
      [name]: value
    });
  };

  // Open delete confirmation modal
  const openDeleteConfirmation = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Handle user deletion
  const confirmDeleteUser = async () => {
    try {
      await axios.delete(`${API_URL}/users/${userToDelete._id}`);
      fetchUsers(); // Refresh user list
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + (error.response?.data?.message || error.message));
    }
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // Handle user status change (activate/deactivate)
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? false : true;
      await axios.put(`${API_URL}/users/${userId}/status`, { isActive: newStatus });
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status: ' + (error.response?.data?.message || error.message));
    }
  };

  // Reset form when modal is closed
  const handleCloseModal = () => {
    setShowUserModal(false);
    setUserFormData({ 
      name: "", 
      email: "",
      role: "inspector", 
      department: "", 
      expertise: [],
      phoneNumber: "",
      password: "",
      isActive: true
    });
  };

  return (
    <div className="content-area">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">System Users</h2>
          <button 
            onClick={() => setShowUserModal(true)}
            className="add-btn"
          >
            Add New User
          </button>
        </div>
        <div className="table-container">
          {loading ? (
            <div className="loading-indicator">Loading users...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : users.length === 0 ? (
            <div className="empty-state">No users found. Add a new user to get started.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department/Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user._id}>
                    <td>{index + 1}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td className="capitalize">{user.role}</td>
                    <td>{user.department || user.expertise?.join(', ') || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button 
                          className={`action-btn ${user.isActive ? 'deactivate-btn' : 'activate-btn'}`}
                          onClick={() => handleToggleUserStatus(user._id, user.isActive ? 'Active' : 'Inactive')}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => openDeleteConfirmation(user)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add New User Modal */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New User</h2>
              <button 
                className="close-btn"
                onClick={handleCloseModal}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUserSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userFormData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userFormData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={userFormData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="inspector">Inspector</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="engineer">Engineer</option>
                    <option value="team">Team</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Conditional fields based on role */}
                {(userFormData.role === "inspector") && (
                  <div className="form-group">
                    <label htmlFor="department">Section</label>
                    <select
                      id="department"
                      name="department"
                      value={userFormData.department}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Section</option>
                      <option value="Colombo-Panadura">Colombo-Panadura</option>
                      <option value="Panadura-Kalutara">Panadura-Kalutara</option>
                      <option value="Kalutara-Aluthgama">Kalutara-Aluthgama</option>
                      <option value="Aluthgama-Galle">Aluthgama-Galle</option>
                      <option value="Galle-Matara">Galle-Matara</option>
                    </select>
                  </div>
                )}

                {(userFormData.role === "maintenance" || userFormData.role === "engineer") && (
                  <div className="form-group">
                    <label htmlFor="department">Team</label>
                    <select
                      id="department"
                      name="department"
                      value={userFormData.department}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Team</option>
                      <option value="Team 1">Team 1</option>
                      <option value="Team 2">Team 2</option>
                      <option value="Team 3">Team 3</option>
                    </select>
                  </div>
                )}

                {userFormData.role === "team" && (
                  <div className="form-group">
                    <label htmlFor="department">Station</label>
                    <select
                      id="department"
                      name="department"
                      value={userFormData.department}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Station</option>
                      <option value="Colombo Central">Colombo Central</option>
                      <option value="Panadura">Panadura</option>
                      <option value="Kalutara">Kalutara</option>
                      <option value="Aluthgama">Aluthgama</option>
                      <option value="Galle">Galle</option>
                      <option value="Matara">Matara</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={userFormData.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={userFormData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="isActive">Status</label>
                  <select
                    id="isActive"
                    name="isActive"
                    value={userFormData.isActive}
                    onChange={(e) => setUserFormData({
                      ...userFormData,
                      isActive: e.target.value === "true"
                    })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">Add User</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="modal-overlay">
          <div className="modal delete-confirm-modal">
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button 
                className="close-btn"
                onClick={cancelDelete}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-confirmation-message">
                <p>Are you sure you want to delete the user <strong>{userToDelete.name}</strong>?</p>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="delete-confirm-btn"
                onClick={confirmDeleteUser}
                style={{
                  backgroundColor: "red",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;