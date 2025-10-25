import React, { useState, useEffect } from 'react';
import { getProjects, createProject, joinProject } from '../services/projectService';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import './ProjectsPage.css';

function ProjectsPage() {
  const visibleSections = useScrollAnimation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinLoading, setJoinLoading] = useState(null);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    skills: '',
    location: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setNewProject({
      ...newProject,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const projectData = {
        ...newProject,
        skills: newProject.skills.split(',').map(s => s.trim()).filter(Boolean)
      };

      await createProject(projectData);
      setNewProject({ title: '', description: '', skills: '', location: '' });
      setShowCreateForm(false);
      await fetchProjects();
    } catch (err) {
      setError(err || 'Failed to create project');
    }
  };

  const handleJoinProject = async (projectId) => {
    setJoinLoading(projectId);
    try {
      await joinProject(projectId);
      await fetchProjects();
      alert('Successfully joined project! 🎉');
    } catch (err) {
      setError(err || 'Failed to join project');
    } finally {
      setJoinLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="projects-page">
        <div className="loading-state fade-in">
          <div className="spinner rotate"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-header" data-section="header">
        <div className={visibleSections.has('header') ? 'fade-in-left' : ''}>
          <h1>Collaborative Projects</h1>
          <p className="page-subtitle">Join or create exciting projects with skilled people</p>
        </div>
        <div className={`projects-stats ${visibleSections.has('header') ? 'scale-in delay-200' : ''}`}>
          <div className="stat-badge">
            <span className="stat-icon">🚀</span>
            <span className="stat-number">{projects.length}</span>
            <span className="stat-label">Active Projects</span>
          </div>
        </div>
      </div>

      {error && <div className="error-message fade-in">{error}</div>}

      <div className={`create-project-section ${visibleSections.has('header') ? 'fade-in-up delay-300' : ''}`}>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`btn btn-primary hover-scale create-toggle-btn ${showCreateForm ? 'active' : ''}`}
        >
          {showCreateForm ? (
            <>
              <span className="btn-icon">✕</span>
              Cancel
            </>
          ) : (
            <>
              <span className="btn-icon">➕</span>
              Create New Project
            </>
          )}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form-container slide-in-down">
          <div className="form-header">
            <h2>Create New Project</h2>
            <p className="form-subtitle">Start a collaborative project and find team members</p>
          </div>
          
          <form onSubmit={handleCreateProject} className="create-form">
            <div className="form-group">
              <label htmlFor="title">
                <span className="label-icon">📝</span>
                Project Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={newProject.title}
                onChange={handleChange}
                placeholder="e.g., Build a Weather App, Learn Spanish Together"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">
                <span className="label-icon">📄</span>
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={newProject.description}
                onChange={handleChange}
                rows="5"
                placeholder="Describe your project, goals, and what you're looking for..."
                required
                className="form-textarea"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="skills">
                  <span className="label-icon">🎯</span>
                  Required Skills
                </label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={newProject.skills}
                  onChange={handleChange}
                  placeholder="e.g., React, Node.js, UI Design"
                  className="form-input"
                />
                <small>Separate skills with commas</small>
              </div>

              <div className="form-group">
                <label htmlFor="location">
                  <span className="label-icon">📍</span>
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={newProject.location}
                  onChange={handleChange}
                  placeholder="Remote, New York, etc."
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary hover-scale">
                <span className="btn-icon">🚀</span>
                Create Project
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary hover-scale"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="projects-grid" data-section="projects">
        {projects.length === 0 ? (
          <div className="empty-state fade-in">
            <div className="empty-icon">📁</div>
            <h3>No Projects Yet</h3>
            <p>Be the first to create a collaborative project!</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary btn-lg hover-scale"
            >
              <span className="btn-icon">➕</span>
              Create First Project
            </button>
          </div>
        ) : (
          projects.map((project, index) => (
            <div
              key={project.id}
              className={`project-card hover-lift ${visibleSections.has('projects') ? 'fade-in-up' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="project-card-header">
                <div className="project-status-badge">
                  <span className="status-icon">🟢</span>
                  <span className="status-text">{project.status || 'Active'}</span>
                </div>
                <div className="member-count-badge">
                  <span className="member-icon">👥</span>
                  <span className="member-count">{project.members?.length || 0}</span>
                </div>
              </div>

              <div className="project-card-body">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.description}</p>

                {project.skills && project.skills.length > 0 && (
                  <div className="project-skills">
                    <span className="skills-label">Required Skills:</span>
                    <div className="skills-list">
                      {project.skills.map((skill, idx) => (
                        <span key={idx} className="skill-tag">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="project-meta">
                  <div className="meta-item">
                    <span className="meta-icon">👤</span>
                    <span className="meta-text">Created by <strong>{project.creatorName}</strong></span>
                  </div>
                  {project.location && (
                    <div className="meta-item">
                      <span className="meta-icon">📍</span>
                      <span className="meta-text">{project.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="project-card-footer">
                <button
                  onClick={() => handleJoinProject(project.id)}
                  disabled={joinLoading === project.id}
                  className="btn btn-primary btn-join hover-scale"
                >
                  {joinLoading === project.id ? (
                    <>
                      <span className="spinner-small rotate"></span>
                      Joining...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🤝</span>
                      Join Project
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProjectsPage;
