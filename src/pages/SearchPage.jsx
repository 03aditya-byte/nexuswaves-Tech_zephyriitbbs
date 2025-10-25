import React, { useState, useEffect } from 'react';
import { searchUsers } from '../services/profileService';
import { createBooking } from '../services/bookingService';
import BookingModal from '../components/BookingModal';
import MapComponent from '../components/MapComponent';
import api from '../services/api';
import './SearchPage.css';

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('offering');
  const [radius, setRadius] = useState(50);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);
        setLocationPermission('granted');

        try {
          await api.put('/users/location', {
            latitude: location.lat,
            longitude: location.lng
          });
        } catch (err) {
          console.error('Failed to save location:', err);
        }
      },
      (error) => {
        console.error('Location error:', error);
        setLocationPermission('denied');
      }
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a skill to search');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSearched(true);
      
      let data;
      if (currentLocation) {
        const response = await api.get('/users/nearby', {
          params: {
            skill: searchQuery,
            radius: radius,
            latitude: currentLocation.lat,
            longitude: currentLocation.lng
          }
        });
        data = response.data;
      } else {
        data = await searchUsers({
          skill: searchQuery,
          type: searchType,
        });
      }
      
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.error || err || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectClick = (user) => {
    setSelectedProvider(user);
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      await createBooking({
        providerId: selectedProvider.id,
        ...bookingData
      });
      
      alert('Booking request sent successfully!');
      setIsBookingModalOpen(false);
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="search-page">
      <h1>Find Skills Nearby</h1>
      <p className="page-subtitle">Connect with people who can teach or learn with you</p>

      {locationPermission === 'denied' && (
        <div className="location-warning">
          <span className="warning-icon">⚠️</span>
          <div>
            <strong>Location access denied</strong>
            <p>Enable location to see nearby users and accurate distances</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={requestLocation}>
            Enable Location
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search for a skill (e.g., React, Guitar, Spanish)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (error) setError('');
            }}
            className="search-input"
            disabled={loading}
          />
          
          <div className="search-controls">
            <div className="search-filters">
              <label className="filter-option">
                <input
                  type="radio"
                  value="offering"
                  checked={searchType === 'offering'}
                  onChange={(e) => setSearchType(e.target.value)}
                  disabled={loading}
                />
                <span>People who can teach</span>
              </label>
              
              <label className="filter-option">
                <input
                  type="radio"
                  value="seeking"
                  checked={searchType === 'seeking'}
                  onChange={(e) => setSearchType(e.target.value)}
                  disabled={loading}
                />
                <span>People who want to learn</span>
              </label>
            </div>

            {currentLocation && (
              <div className="radius-filter">
                <label>Within {radius} km</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  disabled={loading}
                  className="radius-slider"
                />
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-search"
            disabled={loading}
          >
            {loading ? 'Searching...' : '🔍 Search'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Searching for users nearby...</p>
        </div>
      )}

      {!loading && searched && results.length > 0 && (
        <>
          <div className="results-header">
            <h2>Found {results.length} user{results.length !== 1 ? 's' : ''}</h2>
            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                📋 Grid
              </button>
              <button
                className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
                disabled={!currentLocation}
                title={!currentLocation ? 'Enable location to use map view' : ''}
              >
                🗺️ Map
              </button>
            </div>
          </div>

          {viewMode === 'map' && currentLocation ? (
            <MapComponent
              users={results}
              currentLocation={currentLocation}
              onMarkerClick={handleConnectClick}
            />
          ) : null}

          {viewMode === 'grid' && (
            <div className="results-grid">
              {results.map((user) => (
                <div key={user.id} className="result-card">
                  <div className="user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="user-info">
                    <h3>{user.name}</h3>
                    {user.distance !== undefined && (
                      <p className="location">📍 {user.distance} km away</p>
                    )}
                    {user.location && !user.distance && (
                      <p className="location">📍 {user.location}</p>
                    )}
                    {user.bio && (
                      <p className="bio">{user.bio}</p>
                    )}
                  </div>

                  <div className="user-skills">
                    {user.skills && user.skills.map((skill, idx) => (
                      <span 
                        key={idx} 
                        className="skill-badge offering"
                      >
                        {skill.name}
                        <span className="skill-level-badge">
                          L{skill.proficiency}
                        </span>
                      </span>
                    ))}
                  </div>

                  <button 
                    className="btn btn-primary btn-connect"
                    onClick={() => handleConnectClick(user)}
                  >
                    📅 Book Session
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="empty-results">
          <div className="empty-icon">🔍</div>
          <h3>No results found</h3>
          <p>Try searching for different skills or increase your search radius</p>
        </div>
      )}

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSubmit={handleBookingSubmit}
        providerName={selectedProvider?.name || ''}
      />
    </div>
  );
}

export default SearchPage;
