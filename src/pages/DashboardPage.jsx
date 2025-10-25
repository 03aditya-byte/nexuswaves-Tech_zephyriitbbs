import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getBookings } from '../services/bookingService';
import { getCredits } from '../services/creditService';
import { getUserReputation } from '../services/reviewService';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import './DashboardPage.css';

function DashboardPage() {
  const currentUser = getCurrentUser();
  const visibleSections = useScrollAnimation();
  const [stats, setStats] = useState({
    bookings: [],
    credits: 0,
    reputation: null,
    loading: true
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bookingsData, creditsData, reputationData] = await Promise.all([
        getBookings().catch(() => []),
        getCredits().catch(() => ({ balance: 0 })),
        getUserReputation(currentUser.id).catch(() => null)
      ]);

      const completedSessions = bookingsData.filter(b => b.status === 'completed').length;
      const upcomingSessions = bookingsData.filter(
        b => b.status === 'confirmed' && new Date(`${b.date}T${b.time}`) > new Date()
      );

      setStats({
        bookings: upcomingSessions,
        completedSessions,
        credits: creditsData.balance,
        reputation: reputationData,
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (stats.loading) {
    return (
      <div className="dashboard-page">
        <div className="loading fade-in">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header" data-section="header">
        <div className={visibleSections.has('header') ? 'fade-in-left' : ''}>
          <h1>Welcome back, {currentUser?.name}! 👋</h1>
          <p>Here's your skill exchange overview</p>
        </div>
        {stats.reputation && (
          <div className={`reputation-badge-large ${visibleSections.has('header') ? 'scale-in delay-200' : ''}`}>
            <span className="rep-level">{stats.reputation.level}</span>
            <span className="rep-score">{stats.reputation.reputationScore}/100</span>
          </div>
        )}
      </header>

      <div className="dashboard-grid" data-section="cards">
        <div className={`dashboard-card stats-card hover-lift ${visibleSections.has('cards') ? 'fade-in-up' : ''}`}>
          <h3>📊 My Stats</h3>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-value">{stats.completedSessions || 0}</span>
              <span className="stat-label">Sessions Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {stats.reputation?.stats.avgRating || 0}⭐
              </span>
              <span className="stat-label">Avg Rating</span>
            </div>
            <div className="stat-item">
              <span className="stat-value credits-value">
                {stats.credits || 0}
              </span>
              <span className="stat-label">Credits</span>
            </div>
          </div>
          <Link to="/profile" className="btn btn-secondary btn-sm">
            View Full Profile
          </Link>
        </div>

        <div className={`dashboard-card credits-card hover-lift ${visibleSections.has('cards') ? 'fade-in-up delay-100' : ''}`}>
          <h3>💰 Credits Balance</h3>
          <div className="credits-display">
            <div className="credits-amount">{stats.credits}</div>
            <p className="credits-description">
              Use credits to book premium sessions or redeem for rewards
            </p>
          </div>
          <div className="credits-actions">
            <Link to="/search" className="btn btn-primary btn-sm">
              Book Session
            </Link>
            <button className="btn btn-secondary btn-sm" disabled>
              Redeem (Soon)
            </button>
          </div>
        </div>

        <div className={`dashboard-card hover-lift ${visibleSections.has('cards') ? 'fade-in-up delay-200' : ''}`}>
          <h3>📅 Upcoming Sessions</h3>
          <div className="session-list">
            {stats.bookings.length === 0 ? (
              <>
                <p className="placeholder">No upcoming sessions</p>
                <Link to="/search" className="btn btn-secondary">
                  Find Sessions
                </Link>
              </>
            ) : (
              <>
                {stats.bookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="session-item">
                    <div className="session-info">
                      <strong>
                        {booking.isProvider ? booking.seekerName : booking.providerName}
                      </strong>
                      <span className="session-time">
                        {formatDate(booking.date)} at {formatTime(booking.time)}
                      </span>
                    </div>
                    <span className={`session-badge ${booking.isProvider ? 'provider' : 'seeker'}`}>
                      {booking.isProvider ? 'Teaching' : 'Learning'}
                    </span>
                  </div>
                ))}
                <Link to="/booking" className="btn btn-secondary btn-sm">
                  View All Bookings
                </Link>
              </>
            )}
          </div>
        </div>

        <div className={`dashboard-card hover-lift ${visibleSections.has('cards') ? 'fade-in-up delay-300' : ''}`}>
          <h3>🎯 Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/profile" className="action-btn hover-scale">
              <span className="action-icon">✏️</span>
              <span>Edit Profile</span>
            </Link>
            <Link to="/skills" className="action-btn hover-scale">
              <span className="action-icon">🎓</span>
              <span>Manage Skills</span>
            </Link>
            <Link to="/search" className="action-btn hover-scale">
              <span className="action-icon">🔍</span>
              <span>Find Skills</span>
            </Link>
            <Link to="/projects" className="action-btn hover-scale">
              <span className="action-icon">🚀</span>
              <span>Browse Projects</span>
            </Link>
          </div>
        </div>

        {stats.reputation && (
          <div className={`dashboard-card reputation-card hover-lift ${visibleSections.has('cards') ? 'fade-in-up delay-400' : ''}`}>
            <h3>⭐ Reputation</h3>
            <div className="reputation-details">
              <div className="reputation-score-circle pulse">
                <div className="score-number">{stats.reputation.reputationScore}</div>
                <div className="score-label">Score</div>
              </div>
              <div className="reputation-breakdown">
                <div className="rep-item">
                  <span className="rep-label">Level:</span>
                  <span className="rep-value">{stats.reputation.level}</span>
                </div>
                <div className="rep-item">
                  <span className="rep-label">Reviews:</span>
                  <span className="rep-value">{stats.reputation.stats.totalReviews}</span>
                </div>
                <div className="rep-item">
                  <span className="rep-label">Skills:</span>
                  <span className="rep-value">{stats.reputation.stats.totalSkills}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
