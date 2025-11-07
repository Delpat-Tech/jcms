// components/common/DashboardWidget.jsx
import React from 'react';
import TrioLoader from '../ui/TrioLoader';

const DashboardWidget = ({ 
  title,
  children,
  loading = false,
  error = null,
  onRefresh = null,
  className = '',
  size = 'auto', // 'small', 'medium', 'large', 'auto'
  variant = 'default', // 'default', 'stats', 'chart', 'list'
  icon = null,
  actions = null
}) => {
  const getSizeClass = () => {
    const sizeMap = {
      small: 'widget-small',
      medium: 'widget-medium', 
      large: 'widget-large',
      auto: 'widget-auto'
    };
    return sizeMap[size] || sizeMap.auto;
  };

  const getVariantClass = () => {
    const variantMap = {
      default: 'widget-default',
      stats: 'widget-stats',
      chart: 'widget-chart', 
      list: 'widget-list'
    };
    return variantMap[variant] || variantMap.default;
  };

  return (
    <div className={`dashboard-widget ${getSizeClass()} ${getVariantClass()} ${className}`}>
      {(title || icon || actions || onRefresh) && (
        <div className="widget-header">
          <div className="widget-title-section">
            {icon && <div className="widget-icon">{icon}</div>}
            {title && <h3 className="widget-title">{title}</h3>}
          </div>
          
          <div className="widget-actions">
            {onRefresh && (
              <button
                className="widget-refresh-btn"
                onClick={onRefresh}
                disabled={loading}
                aria-label="Refresh data"
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="currentColor"
                  className={loading ? 'spinning' : ''}
                >
                  <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
                  <path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
                </svg>
              </button>
            )}
            {actions}
          </div>
        </div>
      )}
      
      <div className="widget-content">
        {loading && (
          <div className="widget-loading">
            <TrioLoader size="30" color="#3b82f6" />
          </div>
        )}
        
        {error && !loading && (
          <div className="widget-error">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <span className="error-message">{error}</span>
              {onRefresh && (
                <button 
                  className="error-retry-btn"
                  onClick={onRefresh}
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}
        
        {!loading && !error && children}
      </div>
    </div>
  );
};

// Stats Widget - specialized component for displaying statistics
export const StatsWidget = ({ 
  title,
  value, 
  change = null,
  changeType = 'neutral', // 'positive', 'negative', 'neutral'
  icon = null,
  subtitle = null,
  loading = false,
  error = null,
  onRefresh = null,
  className = ''
}) => {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      }
      if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getChangeClass = () => {
    if (!change) return '';
    const changeMap = {
      positive: 'change-positive',
      negative: 'change-negative', 
      neutral: 'change-neutral'
    };
    return changeMap[changeType] || changeMap.neutral;
  };

  const getChangeIcon = () => {
    if (!change) return null;
    if (changeType === 'positive') return '↗';
    if (changeType === 'negative') return '↘';
    return '→';
  };

  return (
    <DashboardWidget
      title={title}
      variant="stats"
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      className={className}
      icon={icon}
    >
      <div className="stats-content">
        <div className="stats-value">
          {formatValue(value)}
        </div>
        
        {subtitle && (
          <div className="stats-subtitle">
            {subtitle}
          </div>
        )}
        
        {change && (
          <div className={`stats-change ${getChangeClass()}`}>
            <span className="change-icon">{getChangeIcon()}</span>
            <span className="change-value">
              {typeof change === 'number' ? Math.abs(change).toFixed(1) : change}%
            </span>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

// List Widget - specialized component for displaying lists
export const ListWidget = ({
  title,
  items = [],
  renderItem = null,
  emptyMessage = 'No items to display',
  maxItems = null,
  showMore = false,
  onShowMore = null,
  loading = false,
  error = null,
  onRefresh = null,
  className = '',
  icon = null
}) => {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  const hasMore = maxItems && items.length > maxItems;

  const defaultRenderItem = (item, index) => (
    <div key={index} className="list-item">
      {typeof item === 'string' ? item : JSON.stringify(item)}
    </div>
  );

  return (
    <DashboardWidget
      title={title}
      variant="list"
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      className={className}
      icon={icon}
    >
      {items.length === 0 ? (
        <div className="list-empty">
          <span>{emptyMessage}</span>
        </div>
      ) : (
        <>
          <div className="list-content">
            {displayItems.map((item, index) => 
              renderItem ? renderItem(item, index) : defaultRenderItem(item, index)
            )}
          </div>
          
          {(hasMore || showMore) && (
            <div className="list-footer">
              {hasMore && (
                <span className="items-count">
                  Showing {displayItems.length} of {items.length}
                </span>
              )}
              {onShowMore && (
                <button 
                  className="show-more-btn"
                  onClick={onShowMore}
                >
                  {hasMore ? 'Show More' : 'Show All'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </DashboardWidget>
  );
};

export default DashboardWidget;
