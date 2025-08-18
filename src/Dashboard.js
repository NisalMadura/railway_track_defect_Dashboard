import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from './config/api';
import { defects } from './AdminDashboard';

const Dashboard = () => {
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Format date as YYYY-MM-DD
    const dateFormatted = date.toISOString().split('T')[0];
    
    // Format time in 12-hour format with AM/PM
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    // Format time
    const timeFormatted = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    return `${dateFormatted} ${timeFormatted}`;
  };

  const [pieChartData, setPieChartData] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  
  // Add state for active teams and resolved count
  const [activeTeams, setActiveTeams] = useState(0);
  const [resolvedThisMonth, setResolvedThisMonth] = useState(0);
  
  // Add state for severity distribution
  const [severityData, setSeverityData] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0
  });

  // Add state for defect type distribution
  const [defectTypeData, setDefectTypeData] = useState([]);

  // Define fetchData function with proper error handling and logging
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the corrected API configuration
      const API_URL = API_CONFIG.getApiUrl(); // This should return the full API URL
      console.log('Fetching data from API URL:', API_URL);
      
      // Test API connectivity first
      try {
        const healthCheck = await axios.get(`${API_URL}/health`, { 
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log('API Health Check:', healthCheck.status);
      } catch (healthError) {
        console.warn('Health check failed, proceeding anyway:', healthError.message);
      }
      
      // Fetch reports data with better error handling
      let allReports = [];
      try {
        console.log('Fetching reports from:', `${API_URL}/reports`);
        const reportsResponse = await axios.get(`${API_URL}/reports`, {
          timeout: API_CONFIG.TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('Reports response:', reportsResponse.status, reportsResponse.data);
        allReports = Array.isArray(reportsResponse.data) ? reportsResponse.data : [];
        
        // Sort reports by date (newest first) and take the 4 most recent ones
        const sortedReports = allReports.sort((a, b) => 
          new Date(b.reportDate || b.createdAt || 0) - new Date(a.reportDate || a.createdAt || 0)
        ).slice(0, 4);
        
        setRecentReports(sortedReports);
        console.log('Set recent reports:', sortedReports.length);
        
      } catch (reportsError) {
        console.error("Error fetching reports:", reportsError);
        throw new Error(`Failed to fetch reports: ${reportsError.message}`);
      }

      // Fetch pie chart data with fallback calculation
      let chartData = { pending: 0, inProgress: 0, resolved: 0 };
      try {
        console.log('Fetching pie chart data from:', `${API_URL}/reports/stats/pie`);
        const pieResponse = await axios.get(`${API_URL}/reports/stats/pie`, {
          timeout: API_CONFIG.TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        chartData = pieResponse.data;
        console.log('Pie chart data:', chartData);
      } catch (pieError) {
        console.warn("Pie chart endpoint failed, calculating from reports:", pieError.message);
        // Calculate from reports data as fallback
        chartData = allReports.reduce((acc, report) => {
          const status = (report.status || '').toLowerCase();
          if (status === 'resolved' || status === 'completed') {
            acc.resolved++;
          } else if (status === 'in progress' || status === 'inprogress' || status === 'active') {
            acc.inProgress++;
          } else {
            acc.pending++;
          }
          return acc;
        }, { pending: 0, inProgress: 0, resolved: 0 });
      }
      setPieChartData(chartData);

      // Fetch active teams data with fallback
      let teamsCount = 0;
      try {
        console.log('Fetching users from:', `${API_URL}/users`);
        const usersResponse = await axios.get(`${API_URL}/users`, {
          timeout: API_CONFIG.TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        teamsCount = users.filter(user => user.isActive === true || user.status === 'active').length;
        console.log('Active teams count:', teamsCount);
      } catch (usersError) {
        console.warn("Users endpoint failed:", usersError.message);
        // Use a default value or calculate from reports
        teamsCount = new Set(allReports.map(r => r.assignedTo).filter(Boolean)).size;
      }
      setActiveTeams(teamsCount);

      // Calculate resolved issues for the current month
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const resolvedInCurrentMonth = allReports.filter(report => {
        if (!report.status || report.status.toLowerCase() !== 'resolved') return false;
        
        const reportDate = new Date(report.reportDate || report.updatedAt || report.createdAt);
        if (isNaN(reportDate.getTime())) return false;
        
        return reportDate.getMonth() + 1 === currentMonth && 
               reportDate.getFullYear() === currentYear;
      });
      
      setResolvedThisMonth(resolvedInCurrentMonth.length);

      // Process severity distribution
      const severityCounts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: allReports.length
      };
      
      allReports.forEach(report => {
        const riskLevel = (report.riskLevel || report.severity || 'medium').toLowerCase();
        const status = (report.status || '').toLowerCase();
        
        if (riskLevel === 'low') {
          severityCounts.low++;
        } else if (riskLevel === 'medium') {
          severityCounts.medium++;
        } else if (riskLevel === 'high') {
          severityCounts.high++;
          // Mark as critical if high risk and not resolved
          if (status !== 'resolved') {
            severityCounts.critical++;
          }
        } else if (riskLevel === 'critical') {
          severityCounts.critical++;
        }
      });
      
      setSeverityData(severityCounts);

      // Process defect type distribution
      const defectTypeCounts = {};
      
      allReports.forEach(report => {
        const defectType = report.defectType || report.type || 'Unknown';
        defectTypeCounts[defectType] = (defectTypeCounts[defectType] || 0) + 1;
      });
      
      const defectTypeArray = Object.entries(defectTypeCounts).map(([type, count]) => ({
        type,
        count,
        percentage: allReports.length > 0 ? (count / allReports.length * 100).toFixed(1) : '0.0'
      }));
      
      defectTypeArray.sort((a, b) => b.count - a.count);
      const topDefectTypes = defectTypeArray.slice(0, 5);
      
      if (defectTypeArray.length > 5) {
        const otherCount = defectTypeArray
          .slice(5)
          .reduce((total, item) => total + item.count, 0);
        
        if (otherCount > 0) {
          topDefectTypes.push({
            type: 'Other',
            count: otherCount,
            percentage: (otherCount / allReports.length * 100).toFixed(1)
          });
        }
      }
      
      setDefectTypeData(topDefectTypes);
      
      console.log('Data fetch completed successfully');
      
    } catch (err) {
      console.error("Error in fetchData:", err);
      const errorMessage = err.response ? 
        `API Error: ${err.response.status} - ${err.response.statusText}` :
        `Network Error: ${err.message}`;
      
      setError(errorMessage);
      
      // Use sample data as fallback if available
      if (typeof defects !== 'undefined' && Array.isArray(defects)) {
        console.log('Using fallback data');
        setRecentReports(defects.slice(0, 4));
      }
      
    } finally {
      setLoading(false);
    }
  };

  // Call fetchData when component mounts
  useEffect(() => {
    console.log('Dashboard component mounted, fetching data...');
    fetchData();
  }, []);

  // Add a debug section to show current API configuration
  const debugInfo = process.env.NODE_ENV === 'development' ? (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
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
          <strong>Data Loading Error:</strong> {error}
          <button 
            onClick={fetchData} 
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

      {/* Overview Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon critical">⚠️</div>
          <div className="stat-content">
            <h3 className="stat-value">{severityData.critical}</h3>
            <p className="stat-label">Critical Issues</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">⚙️</div>
          <div className="stat-content">
            <h3 className="stat-value">{pieChartData.inProgress}</h3>
            <p className="stat-label">In Progress</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✓</div>
          <div className="stat-content">
            <h3 className="stat-value">{resolvedThisMonth}</h3>
            <p className="stat-label">Resolved This Month</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">👥</div>
          <div className="stat-content">
            <h3 className="stat-value">{activeTeams}</h3>
            <p className="stat-label">Active Teams</p>
          </div>
        </div>
      </div>

      {/* Status Tracking and Charts */}
      <div className="dashboard-grid">
        {/* Defect Status Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Defect Status Overview</h2>
            <div className="card-actions">
              <select className="period-selector">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Year</option>
              </select>
            </div>
          </div>
          <div className="chart-container">
            {loading ? (
              <div className="loading-indicator">Loading chart data...</div>
            ) : error ? (
              <div className="error-message">Failed to load chart data</div>
            ) : (
              <div className="chart-placeholder">
                <div className="pie-chart">
                  <div className="pie-segment" style={{
                    transform: "rotate(0deg)", 
                    background: "#e74c3c", 
                    clipPath: `polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 0)`,
                    width: `${pieChartData.pending / (pieChartData.pending + pieChartData.inProgress + pieChartData.resolved) * 100}%`
                  }}></div>
                  <div className="pie-segment" style={{
                    transform: "rotate(130deg)", 
                    background: "#3498db", 
                    clipPath: `polygon(50% 50%, 100% 0, 100% 30%, 0 100%, 0 0)`,
                    width: `${pieChartData.inProgress / (pieChartData.pending + pieChartData.inProgress + pieChartData.resolved) * 100}%`
                  }}></div>
                  <div className="pie-segment" style={{
                    transform: "rotate(200deg)", 
                    background: "#2ecc71", 
                    clipPath: `polygon(50% 50%, 100% 0, 0 0, 0 100%)`,
                    width: `${pieChartData.resolved / (pieChartData.pending + pieChartData.inProgress + pieChartData.resolved) * 100}%`
                  }}></div>
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color" style={{background: "#2ecc71"}}></span>
                    <span className="legend-label">Pending ({pieChartData.pending})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{background: "#3498db"}}></span>
                    <span className="legend-label">In Progress ({pieChartData.inProgress})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{background: "#e74c3c"}}></span>
                    <span className="legend-label">Resolved ({pieChartData.resolved})</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Defect Distribution by Severity */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Defect Distribution by Severity</h2>
            <div className="card-actions">
              <button className="refresh-btn" onClick={fetchData}>↻</button>
            </div>
          </div>
          <div className="severity-distribution">
            {loading ? (
              <div className="loading-indicator">Loading severity data...</div>
            ) : error ? (
              <div className="error-message">Failed to load severity data</div>
            ) : (
              <>
                <div className="severity-item">
                  <div className="severity-badge severity-critical">Critical</div>
                  <div className="count-bar-container">
                    <div 
                      className="count-bar count-critical" 
                      style={{
                        width: `${severityData.total > 0 ? (severityData.critical / severityData.total * 100) : 0}%`
                      }}
                    ></div>
                    <span className="count-value">{severityData.critical}</span>
                  </div>
                </div>
                <div className="severity-item">
                  <div className="severity-badge severity-high">High</div>
                  <div className="count-bar-container">
                    <div 
                      className="count-bar count-high" 
                      style={{
                        width: `${severityData.total > 0 ? (severityData.high / severityData.total * 100) : 0}%`
                      }}
                    ></div>
                    <span className="count-value">{severityData.high}</span>
                  </div>
                </div>
                <div className="severity-item">
                  <div className="severity-badge severity-medium">Medium</div>
                  <div className="count-bar-container">
                    <div 
                      className="count-bar count-medium" 
                      style={{
                        width: `${severityData.total > 0 ? (severityData.medium / severityData.total * 100) : 0}%`
                      }}
                    ></div>
                    <span className="count-value">{severityData.medium}</span>
                  </div>
                </div>
                <div className="severity-item">
                  <div className="severity-badge severity-low">Low</div>
                  <div className="count-bar-container">
                    <div 
                      className="count-bar count-low" 
                      style={{
                        width: `${severityData.total > 0 ? (severityData.low / severityData.total * 100) : 0}%`
                      }}
                    ></div>
                    <span className="count-value">{severityData.low}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="distribution-footer">
            <p className="distribution-total">Total Active Defects: {severityData.total}</p>
            <button className="view-details-btn">View Details</button>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="card wide">
          <div className="card-header">
            <h2 className="card-title">Recent Activity</h2>
            <div className="card-actions">
              <button className="view-all-btn">View All</button>
            </div>
          </div>
          <div className="table-container">
            {loading ? (
              <div className="loading-indicator">Loading recent reports...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Section</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Team</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.length > 0 ? recentReports.map((report, index) => (
                    <tr key={report._id || report.id || index}>
                      <td>#{index + 1}</td>
                      <td>{report.location || report.section || 'N/A'}</td>
                      <td>{report.defectType || report.type || 'N/A'}</td>
                      <td>
                        <span className={`severity-badge severity-${(report.riskLevel || report.severity || 'medium').toLowerCase()}`}>
                          {report.riskLevel || report.severity || 'Medium'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${(report.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                          {report.status || 'Pending'}
                        </span>
                      </td>
                      <td>{formatDate(report.reportDate || report.date || report.createdAt)}</td>
                      <td>{report.assignedTo || report.team || 'Unassigned'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>
                        No recent reports found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Section Issue Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Issues by Section</h2>
          </div>
          <div className="chart-container">
            <div className="bar-chart-placeholder">
              <div className="bar-chart">
                <div className="bar-container">
                  <div className="bar-label">Colombo-Panadura</div>
                  <div className="bar" style={{width: "65%"}}></div>
                  <div className="bar-value">12</div>
                </div>
                <div className="bar-container">
                  <div className="bar-label">Panadura-Kalutara</div>
                  <div className="bar" style={{width: "40%"}}></div>
                  <div className="bar-value">8</div>
                </div>
                <div className="bar-container">
                  <div className="bar-label">Kalutara-Aluthgama</div>
                  <div className="bar" style={{width: "85%"}}></div>
                  <div className="bar-value">17</div>
                </div>
                <div className="bar-container">
                  <div className="bar-label">Aluthgama-Galle</div>
                  <div className="bar" style={{width: "75%"}}></div>
                  <div className="bar-value">15</div>
                </div>
                <div className="bar-container">
                  <div className="bar-label">Galle-Matara</div>
                  <div className="bar" style={{width: "60%"}}></div>
                  <div className="bar-value">11</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Issue Type Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Issues by Type</h2>
          </div>
          <div className="chart-container">
            {loading ? (
              <div className="loading-indicator">Loading defect type data...</div>
            ) : error ? (
              <div className="error-message">Failed to load defect type data</div>
            ) : (
              <div className="stat-distribution">
                {defectTypeData.length > 0 ? defectTypeData.map((item, index) => (
                  <div className="stat-item" key={index}>
                    <div className="stat-item-label">{item.type}</div>
                    <div className="stat-progress-bar">
                      <div 
                        className="stat-progress" 
                        style={{width: `${item.percentage}%`}}
                      ></div>
                    </div>
                    <div className="stat-item-value">({item.percentage}%)</div>
                  </div>
                )) : (
                  <div className="no-data">No defect type data available</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="card wide">
        <div className="card-header">
          <h2 className="card-title">Team Performance</h2>
          <div className="card-actions">
            <select className="period-selector">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Quarter</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Issues Assigned</th>
                <th>Issues Resolved</th>
                <th>Avg. Resolution Time</th>
                <th>Success Rate</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Maintenance Team 1</td>
                <td>24</td>
                <td>22</td>
                <td>1.8 days</td>
                <td>91.7%</td>
                <td>
                  <div className="performance-bar">
                    <div className="performance-progress" style={{width: "92%"}}></div>
                  </div>
                </td>
              </tr>
              <tr>
                <td>Maintenance Team 2</td>
                <td>18</td>
                <td>15</td>
                <td>2.3 days</td>
                <td>83.3%</td>
                <td>
                  <div className="performance-bar">
                    <div className="performance-progress" style={{width: "83%"}}></div>
                  </div>
                </td>
              </tr>
              <tr>
                <td>Maintenance Team 3</td>
                <td>21</td>
                <td>19</td>
                <td>2.1 days</td>
                <td>90.5%</td>
                <td>
                  <div className="performance-bar">
                    <div className="performance-progress" style={{width: "90%"}}></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;