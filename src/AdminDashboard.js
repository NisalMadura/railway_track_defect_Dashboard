import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import axios from 'axios';
import API_CONFIG from './config/api';
import Dashboard from './Dashboard';
import DefectManagement from './DefectManagement';
import UserManagement from './UserManagement';

// Sample data (will be shared across components)
export const defects = [
  { id: 1, section: "Colombo-Panadura", type: "Surface Crack", severity: "Medium", status: "In Progress", date: "2025-03-20", assignedTo: "Maintenance Team 3" },
  { id: 2, section: "Panadura-Kalutara", type: "Deep Crack", severity: "High", status: "Pending", date: "2025-03-21", assignedTo: "Unassigned" },
  { id: 3, section: "Kalutara-Aluthgama", type: "Weld Failure", severity: "Critical", status: "Pending", date: "2025-03-22", assignedTo: "Unassigned" },
  { id: 4, section: "Aluthgama-Galle", type: "Surface Crack", severity: "Low", status: "Resolved", date: "2025-03-18", assignedTo: "Maintenance Team 1" },
  { id: 5, section: "Galle-Matara", type: "Deep Crack", severity: "Medium", status: "In Progress", date: "2025-03-19", assignedTo: "Maintenance Team 2" }
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([
    { id: 1, name: "Rajiv Perera", role: "Inspector", section: "Colombo-Panadura", status: "Active" },
    { id: 2, name: "Amara Silva", role: "Maintenance Lead", team: "Team 1", status: "Active" },
    { id: 3, name: "Malik Fernando", role: "Operator", station: "Colombo Central", status: "Inactive" },
    { id: 4, name: "Priya Gunawardena", role: "Inspector", section: "Galle-Matara", status: "Active" },
    { id: 5, name: "Sunil Jayawardena", role: "Maintenance Worker", team: "Team 2", status: "Active" }
  ]);

  // Function to handle user status changes (shared with UserManagement)
  const handleDeactivateUser = (userId) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return user;
    });
    setUsers(updatedUsers);
  };

  // Function to add a new user (shared with UserManagement)
  const addUser = (newUser) => {
    setUsers([...users, newUser]);
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">Railway Track Checker</div>
        <nav className="nav-menu">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('defects')} 
            className={`nav-item ${activeTab === 'defects' ? 'active' : ''}`}
          >
            <span className="nav-icon">⚠️</span>
            Defect Management
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
          >
            <span className="nav-icon">👥</span>
            User Management
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <h1 className="page-title">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'defects' && 'Defect Management'}
              {activeTab === 'users' && 'User Management'}
            </h1>
            <div className="user-section">
              <button className="notification-btn">
                🔔
              </button>
              <div className="user-info">
                <div className="user-avatar">A</div>
                <span className="user-name">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Conditional rendering based on activeTab */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'defects' && <DefectManagement defects={defects} />}
        {activeTab === 'users' && (
          <UserManagement 
            users={users} 
            handleDeactivateUser={handleDeactivateUser} 
            addUser={addUser} 
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;