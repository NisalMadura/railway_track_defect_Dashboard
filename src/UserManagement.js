import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from './config/api';
import './AdminDashboard.css'; // Make sure to create this CSS file

const UserManagement = () => {
  // Fix: Use the correct API configuration method
  const API_URL = API_CONFIG.getApiUrl();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    console.log('UserManagement component mounted, fetching users...');
    console.log('API URL:', API_URL);
    fetchUsers();
  }, []);

  // Fetch all users from API with better error handling
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching users from:', `${API_URL}/users`);
      
      // Test API connectivity first
      try {
        const healthCheck = await axios.get(`${API_URL}/health`, { 
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log('API Health Check for users:', healthCheck.status);
      } catch (healthError) {
        console.warn('Health check failed, proceeding anyway:', healthError.message);
      }
      
      const response = await axios.get(`${API_URL}/users`, {
        timeout: API_CONFIG.TIMEOUT || 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Users response:', response.status, response.data);
      
      // Ensure we have an array
      const usersData = Array.isArray(response.data) ? response.data : 
                       Array.isArray(response.data.users) ? response.data.users : 
                       [];
      
      setUsers(usersData);
      console.log('Set users:', usersData.length, 'users loaded');
      
    } catch (error) {
      console.error('Error fetching users:', error);
      
      let errorMessage = 'Failed to load users. ';
      
      if (error.response) {
        // Server responded with error status
        errorMessage += `Server error: ${error.response.status} - ${error.response.statusText}`;
        if (error.response.data?.message) {
          errorMessage += ` (${error.response.data.message})`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage += 'No response from server. Check if the API server is running and accessible.';
      } else {
        // Something else happened
        errorMessage += error.message;
      }
      
      setError(errorMessage);
      
      // Set sample data for development/testing
      const sampleUsers = [
        {
          _id: 'sample1',
          name: 'John Inspector',
          email: 'john@example.com',
          role: 'inspector',
          department: 'Colombo-Panadura',
          isActive: true
        },
        {
          _id: 'sample2', 
          name: 'Jane Maintenance',
          email: 'jane@example.com',
          role: 'maintenance',
          department: 'Team 1',
          isActive: false
        }
      ];
      
      console.log('Using sample data due to API error');
      setUsers(sampleUsers);
      
    } finally {
      setLoading(false);
    }
  };

  // Handle user form submission with better error handling
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Submitting user data:', userFormData);
      
      // Validate required fields
      if (!userFormData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!userFormData.email.trim()) {
        throw new Error('Email is required');
      }
      if (!userFormData.password.trim()) {
        throw new Error('Password is required');
      }
      if (!userFormData.department.trim()) {
        throw new Error('Department/Section is required');
      }
      
      const response = await axios.post(`${API_URL}/users`, userFormData, {
        timeout: API_CONFIG.TIMEOUT || 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('User created successfully:', response.data);
      
      // Refresh user list
      await fetchUsers();
      
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
      
      alert('User added successfully!');
      
    } catch (error) {
      console.error('Error adding user:', error);
      
      let errorMessage = 'Failed to add user: ';
      
      if (error.response) {
        errorMessage += error.response.data?.message || error.response.statusText;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred';
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes in the user form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change:', name, value);
    setUserFormData({
      ...userFormData,
      [name]: value
    });
  };

  // Open delete confirmation modal
  const openDeleteConfirmation = (user) => {
    console.log('Opening delete confirmation for user:', user.name);
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Handle user deletion with better error handling
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      console.log('Deleting user:', userToDelete._id);
      
      await axios.delete(`${API_URL}/users/${userToDelete._id}`, {
        timeout: API_CONFIG.TIMEOUT || 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('User deleted successfully');
      
      // Refresh user list
      await fetchUsers();
      
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      alert('User deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting user:', error);
      
      let errorMessage = 'Failed to delete user: ';
      
      if (error.response) {
        errorMessage += error.response.data?.message || error.response.statusText;
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // Handle user status change (activate/deactivate) with better error handling
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      console.log('Toggling user status:', userId, 'current:', currentStatus);
      
      const newStatus = currentStatus === 'Active' || currentStatus === true ? false : true;
      
      await axios.put(`${API_URL}/users/${userId}/status`, 
        { isActive: newStatus },
        {
          timeout: API_CONFIG.TIMEOUT || 30000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log('User status updated successfully');
      
      // Refresh user list
      await fetchUsers();
      
    } catch (error) {
      console.error('Error updating user status:', error);
      
      let errorMessage = 'Failed to update user status: ';
      
      if (error.response) {
        errorMessage += error.response.data?.message || error.response.statusText;
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
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

  // Add a debug section to show current API configuration
  const debugInfo = process.env.NODE_ENV === 'development' ? (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      right: 0, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      fontSize: '12px',
      zIndex: 9999 
    }}>
    
    </div>
  ) : null;

  return (
    <div className="content-area">
      {debugInfo}
      
      {error && (
        <div className="error-banner" style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          marginBottom: '20px',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>API Connection Error:</strong> {error}
          <button 
            onClick={fetchUsers} 
            style={{ 
              marginLeft: '10px', 
              padding: '5px 10px', 
              background: '#721c24', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px', 
              cursor: 'pointer' 
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">System Users</h2>
          <button 
            onClick={() => setShowUserModal(true)}
            className="add-btn"
            disabled={loading}
          >
            Add New User
          </button>
        </div>
        <div className="table-container">
          {loading ? (
            <div className="loading-indicator">Loading users...</div>
          ) : users.length === 0 && !error ? (
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
                  <tr key={user._id || user.id || index}>
                    <td>{index + 1}</td>
                    <td>{user.name || 'N/A'}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td className="capitalize">{user.role || 'N/A'}</td>
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
                          onClick={() => handleToggleUserStatus(user._id || user.id, user.isActive ? 'Active' : 'Inactive')}
                          disabled={loading}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => openDeleteConfirmation(user)}
                          disabled={loading}
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
                disabled={isSubmitting}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUserSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userFormData.name}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userFormData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    name="role"
                    value={userFormData.role}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
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
                    <label htmlFor="department">Section *</label>
                    <select
                      id="department"
                      name="department"
                      value={userFormData.department}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
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
                    <label htmlFor="department">Team *</label>
                    <select
                      id="department"
                      name="department"
                      value={userFormData.department}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
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
                    <label htmlFor="department">Station *</label>
                    <select
                      id="department"
                      name="department"
                      value={userFormData.department}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={userFormData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    minLength="6"
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Adding...' : 'Add User'}
                  </button>
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