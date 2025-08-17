import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from './config/api'; // Import the simple API config
import DefectDetail from './defectDetails'; // Import the DefectDetail component

const DefectManagement = () => {
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredStatus, setFilteredStatus] = useState('');
  const [filteredRiskLevel, setFilteredRiskLevel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDefectId, setSelectedDefectId] = useState(null);
  const defectsPerPage = 6;

  // Fetch defects from API
  useEffect(() => {
    const fetchDefects = async () => {
      try {
        setLoading(true);
        
        const apiUrl = `${API_CONFIG.getApiUrl()}/reports`;
        
        console.log('Fetching from:', apiUrl);
        console.log('Environment:', process.env.NODE_ENV);
        
        const response = await axios.get(apiUrl, {
          timeout: API_CONFIG.TIMEOUT,
        });
        
        console.log('Response received:', response.data);
        setDefects(response.data);
        setError(null); // Clear any previous errors
        setLoading(false);
      } catch (err) {
        console.error('Error details:', err);
        
        let errorMessage = 'Failed to fetch defects data';
        
        if (err.response) {
          errorMessage += ` (${err.response.status})`;
        } else if (err.request) {
          errorMessage += ' - Network error';
        } else {
          errorMessage += ` - ${err.message}`;
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchDefects();
  }, []);

  // Handle row click to view defect details
  const handleRowClick = (defectId) => {
    setSelectedDefectId(defectId);
  };

  // Handle going back to the defect list
  const handleBackToList = () => {
    setSelectedDefectId(null);
  };

  // Filter defects based on the selected filters and search query
  const getFilteredDefects = () => {
    return defects.filter(defect => {
      const matchesStatus = !filteredStatus || defect.status === filteredStatus;
      const matchesRiskLevel = !filteredRiskLevel || defect.riskLevel === filteredRiskLevel;
      const matchesSearchQuery = !searchQuery || 
        defect.defectType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        defect.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesRiskLevel && matchesSearchQuery;
    });
  };

  const filteredDefects = getFilteredDefects();
  
  // Calculate pagination
  const indexOfLastDefect = currentPage * defectsPerPage;
  const indexOfFirstDefect = indexOfLastDefect - defectsPerPage;
  const currentDefects = filteredDefects.slice(indexOfFirstDefect, indexOfLastDefect);
  const totalPages = Math.ceil(filteredDefects.length / defectsPerPage);

  // Format date to a more readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) return <div className="loading">Loading defects data...</div>;
  if (error) return <div className="error">{error}</div>;

  // If a defect is selected, show the DefectDetail component
  if (selectedDefectId) {
    return <DefectDetail id={selectedDefectId} onBack={handleBackToList} />;
  }

  // Otherwise, show the defect list
  return (
    <div className="content-area">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Reported Defects</h2>
          <div className="header-actions">
            <div className="search-container">
              <input 
                type="text" 
                placeholder="Search defects..." 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-btn">🔍</button>
            </div>
          </div>
        </div>
        
        <div className="filter-row">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select 
              className="filter-select"
              value={filteredStatus}
              onChange={(e) => setFilteredStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Filter by Risk Level:</label>
            <select 
              className="filter-select"
              value={filteredRiskLevel}
              onChange={(e) => setFilteredRiskLevel(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Defect Type</th>
                <th>Report Date</th>
                <th>Location</th>
                <th>Description</th>
                <th>Risk Level</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody>
              {currentDefects.map((defect) => (
                <tr 
                  key={defect._id} 
                  onClick={() => handleRowClick(defect._id)}
                  className="clickable-row"
                >
                  <td>
                    <div className="defect-thumbnail">
                      {defect.imageUrl ? (
                        <img src={defect.imageUrl} alt="Defect" className="defect-image" />
                      ) : (
                        <span className="image-placeholder">📷</span>
                      )}
                    </div>
                  </td>
                  <td>{defect.defectType}</td>
                  <td>{formatDate(defect.reportDate)}</td>
                  <td>{defect.location}</td>
                  <td className="defect-description">
                    <div className="description-text">
                      {defect.description}
                    </div>
                  </td>
                  <td>
                    <span className={`risk-badge risk-${defect.riskLevel.toLowerCase()}`}>
                      {defect.riskLevel}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${defect.status.toLowerCase().replace(' ', '-')}`}>
                      {defect.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDefects.length === 0 && defects.length > 0 && (
          <div className="no-results">No defects found matching your criteria</div>
        )}
        
        <div className="pagination">
          <button 
            className="pagination-btn" 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => (
              <button 
                key={i + 1}
                className={`pagination-number ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
          <div className="pagination-info">
            Showing {indexOfFirstDefect + 1}-{Math.min(indexOfLastDefect, filteredDefects.length)} of {filteredDefects.length} defects
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefectManagement;