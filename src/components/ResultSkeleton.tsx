interface ResultSkeletonProps {
  count?: number;
}

export function ResultSkeleton({ count = 6 }: ResultSkeletonProps) {
  return (
    <ul className="results-list skeleton" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="result-item skeleton-item">
          <div className="poster-wrap skeleton-box" />
          <div className="result-body">
            <div className="skeleton-line w75" />
            <div className="skeleton-line w40" />
            <div className="skeleton-badge" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default ResultSkeleton;
