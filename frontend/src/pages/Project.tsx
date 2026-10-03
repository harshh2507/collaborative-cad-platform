import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/Button';
import { projectsApi } from '../services/api';
import type { Project, ProjectVersion, ApiError } from '../types';
import './Project.css';
 
export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
 
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
 
    Promise.all([projectsApi.get(id), projectsApi.listVersions(id)])
      .then(([projectData, versionData]) => {
        if (cancelled) return;
        setProject(projectData);
        setVersions(versionData);
      })
      .catch((err: ApiError) => {
        if (!cancelled) setLoadError(err.message || 'Could not load this project.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
 
    return () => {
      cancelled = true;
    };
  }, [id]);
 
  if (isLoading) {
    return (
      <div className="page-container">
        <div className="state-block">Loading project...</div>
      </div>
    );
  }
 
  if (loadError || !project) {
    return (
      <div className="page-container">
        <div className="state-block state-block--error">
          <div className="state-block__title">Couldn&apos;t load this project</div>
          {loadError || 'Project not found.'}
        </div>
      </div>
    );
  }
 
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-kicker">Project</div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && (
            <p className="page-subtitle">{project.description}</p>
          )}
        </div>
        <Link to={`/projects/${id}/annotations`}>
          <Button variant="secondary">View annotations</Button>
        </Link>
      </div>
 
      <div className="project-detail">
        <div className="viewport-panel card">
          <div className="viewport-panel__canvas">
            <ModelPlaceholder />
            <p>3D viewer renders here</p>
            <span>Latest model file loads into the Three.js canvas</span>
          </div>
        </div>
 
        <div className="versions-panel card">
          <div className="versions-panel__header">Version history</div>
          {versions.length === 0 ? (
            <div className="state-block">No versions uploaded yet.</div>
          ) : (
            <ul className="versions-panel__list">
              {versions.map((version) => (
                <li key={version.id} className="version-item">
                  <div className="version-item__number">v{version.versionNumber}</div>
                  <div>
                    <div className="version-item__name">{version.fileName}</div>
                    <div className="version-item__meta">
                      {new Date(version.createdAt).toLocaleDateString()} ·{' '}
                      {version.createdBy}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
 
function ModelPlaceholder() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
      <path
        d="m12 3 8 4.6v8.8L12 21l-8-4.6V7.6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M12 12v9M4 7.6 12 12l8-4.4M12 12 20 7.6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
 