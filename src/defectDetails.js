import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from '../api'; // Import the simple API config

const DefectDetail = ({ id, onBack }) => {
  const [defect, setDefect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDefectDetails = async () => {
      try {
        setLoading(true);
        
        const apiUrl = `${API_CONFIG.getApiUrl()}/reports/${id}`;
        
        console.log('Fetching defect details from:', apiUrl);
        
        const response = await axios.get(apiUrl, {
          timeout: API_CONFIG.TIMEOUT,
        });
        
        console.log('Defect details received:', response.data);
        setDefect(response.data);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching defect details:', err);
        
        let errorMessage = 'Failed to fetch defect details';
        
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

    if (id) {
      fetchDefectDetails();
    }
  }, [id]);

  // Format date to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGoBack = () => {
    if (onBack && typeof onBack === 'function') {
      onBack();
    }
  };

  // Custom styles for large screens
  const styles = {
    contentArea: {
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%'
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    },
    backButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#f3f4f6',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'background-color 0.2s ease'
    },
    cardContent: {
      padding: '1.5rem'
    },
    defectHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      flexDirection: 'row'
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'minmax(300px, 2fr) 3fr',
      gap: '2rem'
    },
    imageContainer: {
      position: 'relative',
      height: 'auto',
      borderRadius: '8px',
      overflow: 'hidden'
    },
    image: {
      width: '100%',
      height: 'auto',
      maxHeight: '500px',
      objectFit: 'contain',
      borderRadius: '8px',
      backgroundColor: '#f9fafb'
    },
    noImage: {
      backgroundColor: '#f3f4f6',
      height: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      color: '#6b7280',
      fontStyle: 'italic'
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem'
    },
    infoGroup: {
      backgroundColor: '#f9fafb',
      padding: '1rem',
      borderRadius: '6px',
      transition: 'transform 0.2s ease',
      height: '100%'
    },
    infoLabel: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#6b7280',
      marginBottom: '0.25rem'
    },
    infoValue: {
      fontSize: '1rem'
    },
    descriptionBox: {
      backgroundColor: '#f9fafb',
      padding: '1.5rem',
      borderRadius: '6px',
      marginBottom: '1.5rem'
    },
    commentsSection: {
      marginTop: '2rem',
      borderTop: '1px solid #e5e7eb',
      paddingTop: '1.5rem'
    },
    commentItem: {
      backgroundColor: '#f9fafb',
      padding: '1rem',
      borderRadius: '6px',
      marginBottom: '1rem'
    },
    statusBadge: (status) => {
      const colors = {
        'open': { bg: '#dbeafe', text: '#1e40af' },
        'pending': { bg: '#fef3c7', text: '#92400e' },
        'in-progress': { bg: '#fef3c7', text: '#92400e' },
        'resolved': { bg: '#d1fae5', text: '#065f46' },
        'closed': { bg: '#e5e7eb', text: '#374151' }
      };
      
      const statusKey = status?.toLowerCase().replace(' ', '-') || 'open';
      const color = colors[statusKey] || colors.open;
      
      return {
        backgroundColor: color.bg,
        color: color.text,
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '500',
        display: 'inline-block'
      };
    },
    riskBadge: (risk) => {
      const colors = {
        'critical': { bg: '#fee2e2', text: '#b91c1c' },
        'high': { bg: '#fee2e2', text: '#b91c1c' },
        'medium': { bg: '#fef3c7', text: '#92400e' },
        'low': { bg: '#d1fae5', text: '#065f46' }
      };
      
      const riskKey = risk?.toLowerCase() || 'low';
      const color = colors[riskKey] || colors.low;
      
      return {
        backgroundColor: color.bg,
        color: color.text,
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '500',
        display: 'inline-block',
        marginRight: '0.5rem'
      };
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading defect details...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
  if (!defect) return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>Defect not found</div>;

  return (
    <div style={styles.contentArea}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <button 
            style={styles.backButton} 
            onClick={handleGoBack}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          >
            ← Back to Defects
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Defect Details</h2>
          <div style={{ width: '120px' }}></div> {/* Spacer for alignment */}
        </div>
        
        <div style={styles.cardContent}>
          <div style={styles.defectHeader}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>{defect.defectType}</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={styles.riskBadge(defect.riskLevel)}>
                {defect.riskLevel} Risk
              </span>
              <span style={styles.statusBadge(defect.status)}>
                {defect.status}
              </span>
            </div>
          </div>
          
          <div style={styles.gridContainer}>
            <div style={styles.imageContainer}>
              {defect.imageUrl ? (
                <img 
                  src={defect.imageUrl} 
                  alt="Defect" 
                  style={styles.image}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Cpath d='M30 40 L70 70 M70 40 L30 70' stroke='%236b7280' stroke-width='2'/%3E%3C/svg%3E";
                  }}
                />
              ) : (
                <div style={styles.noImage}>No image available</div>
              )}
            </div>
            
            <div>
              <div style={styles.infoGrid}>
                <div style={styles.infoGroup}>
                  <h4 style={styles.infoLabel}>Location</h4>
                  <p style={styles.infoValue}>{defect.location || 'Unknown location'}</p>
                </div>
                
                <div style={styles.infoGroup}>
                  <h4 style={styles.infoLabel}>Report Date</h4>
                  <p style={styles.infoValue}>{formatDate(defect.reportDate)}</p>
                </div>
                
                <div style={styles.infoGroup}>
                  <h4 style={styles.infoLabel}>Reported By</h4>
                  <p style={styles.infoValue}>{defect.reportedBy || 'Unknown'}</p>
                </div>
                
                <div style={styles.infoGroup}>
                  <h4 style={styles.infoLabel}>Assigned To</h4>
                  <p style={styles.infoValue}>{defect.assignedTo || 'Not assigned'}</p>
                </div>
                
                <div style={styles.infoGroup}>
                  <h4 style={styles.infoLabel}>Due Date</h4>
                  <p style={styles.infoValue}>{defect.dueDate ? formatDate(defect.dueDate) : 'Not set'}</p>
                </div>
              </div>
              
              <div style={styles.descriptionBox}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>Description</h4>
                <p style={{ margin: 0, lineHeight: '1.6' }}>{defect.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>
          
          {defect.comments && defect.comments.length > 0 && (
            <div style={styles.commentsSection}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Comments ({defect.comments.length})</h4>
              <div style={{ maxWidth: '900px' }}>
                {defect.comments.map((comment, index) => (
                  <div key={index} style={styles.commentItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '500' }}>{comment.author || 'Anonymous'}</span>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{formatDate(comment.timestamp)}</span>
                    </div>
                    <p style={{ margin: 0 }}>{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefectDetail;