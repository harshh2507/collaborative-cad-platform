import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { annotationsApi } from '../services/api';
import type { Annotation, AnnotationStatus, ApiError } from '../types';
import './Annotation.css';
 
const STATUS_FILTERS: Array<AnnotationStatus | 'ALL'> = [
  'ALL',
  'OPEN',
  'ASSIGNED',
  'FIXED',
  'VERIFIED',
  'CLOSED',
];
 
export default function AnnotationPage() {
  const { id } = useParams<{ id: string }>();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<AnnotationStatus | 'ALL'>('ALL');
 
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
 
    annotationsApi
      .list(id)
      .then((data) => {
        if (!cancelled) setAnnotations(data);
      })
      .catch((err: ApiError) => {
        if (!cancelled) setLoadError(err.message || 'Could not load annotations.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
 
    return () => {
      cancelled = true;
    };
  }, [id]);
 
  const filtered = useMemo(
    () =>
      activeFilter === 'ALL'
        ? annotations
        : annotations.filter((a) => a.status === activeFilter),
    [annotations, activeFilter]
  );
 
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-kicker">Review</div>
          <h1 className="page-title">Annotations</h1>
          <p className="page-subtitle">
            Every comment left on this model, in one thread.
          </p>
        </div>
      </div>
 
      <div className="annotation-filters">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            className={`annotation-filter ${
              activeFilter === status ? 'annotation-filter--active' : ''
            }`}
            onClick={() => setActiveFilter(status)}
          >
            {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
 
      {isLoading && <div className="state-block">Loading annotations...</div>}
 
      {!isLoading && loadError && (
        <div className="state-block state-block--error">
          <div className="state-block__title">Couldn&apos;t load annotations</div>
          {loadError}
        </div>
      )}
 
      {!isLoading && !loadError && filtered.length === 0 && (
        <div className="state-block">
          <div className="state-block__title">No annotations here</div>
          {activeFilter === 'ALL'
            ? 'Comments left on the model will show up in this thread.'
            : `Nothing marked ${activeFilter.toLowerCase()} yet.`}
        </div>
      )}
 
      {!isLoading && !loadError && filtered.length > 0 && (
        <ul className="annotation-list">
          {filtered.map((annotation) => (
            <li key={annotation.id} className="annotation-card card">
              <div className="annotation-card__pin" />
              <div className="annotation-card__body">
                <div className="annotation-card__top">
                  <span className="annotation-card__author">
                    {annotation.authorName}
                  </span>
                  <StatusBadge status={annotation.status} />
                </div>
                <p className="annotation-card__comment">{annotation.comment}</p>
                <div className="annotation-card__meta">
                  {new Date(annotation.createdAt).toLocaleString()} · position (
                  {annotation.position.x.toFixed(1)}, {annotation.position.y.toFixed(1)},{' '}
                  {annotation.position.z.toFixed(1)})
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
 
function StatusBadge({ status }: { status: AnnotationStatus }) {
  return (
    <span className={`badge badge--${status.toLowerCase()}`}>
      <span className="badge__dot" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
 