'use client';

import { useState, useEffect, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Card, Text, Skeleton, EmptyState, Button } from '@/app/components/ui';
import NotificationItem from './NotificationItem';
import NotificationFilters from './NotificationFilters';

const MAX_NOTIFICATIONS = 200; // Memory safeguard per RESEARCH.md Pitfall #3

export default function NotificationInbox() {
  const [notifications, setNotifications] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isFiltered = typeFilter || statusFilter;

  // Fetch notifications
  const fetchNotifications = useCallback(async (resetList = false) => {
    try {
      const params = new URLSearchParams({
        limit: '50',
      });

      if (!resetList && cursor) {
        params.set('cursor', cursor);
      }
      if (typeFilter) {
        params.set('type', typeFilter);
      }
      if (statusFilter) {
        params.set('status', statusFilter);
      }

      const res = await fetch(`/api/notifications/history?${params}`);

      if (!res.ok) {
        throw new Error('Errore nel caricamento delle notifiche');
      }

      const data = await res.json();

      if (resetList) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }

      setCursor(data.cursor);

      // Check if we've hit max or no more data
      const totalAfter = resetList
        ? data.notifications.length
        : notifications.length + data.notifications.length;

      setHasMore(data.hasMore && totalAfter < MAX_NOTIFICATIONS);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, typeFilter, statusFilter, notifications.length]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    fetchNotifications(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter]); // Reset on filter change

  // Handle filter changes
  const handleTypeChange = (value) => {
    setTypeFilter(value);
    setCursor(null);
    setNotifications([]);
    setHasMore(true);
    setIsLoading(true);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCursor(null);
    setNotifications([]);
    setHasMore(true);
    setIsLoading(true);
  };

  const handleClearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setCursor(null);
    setNotifications([]);
    setHasMore(true);
    setIsLoading(true);
  };

  // Loading state
  if (isLoading && notifications.length === 0) {
    return (
      <div className="space-y-4">
        <NotificationFilters
          type={typeFilter}
          status={statusFilter}
          onTypeChange={handleTypeChange}
          onStatusChange={handleStatusChange}
          onClear={handleClearFilters}
          isFiltered={isFiltered}
        />
        <Card liquid>
          <div className="divide-y divide-slate-700/50 [html:not(.dark)_&]:divide-slate-200">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && notifications.length === 0) {
    return (
      <div className="space-y-4">
        <NotificationFilters
          type={typeFilter}
          status={statusFilter}
          onTypeChange={handleTypeChange}
          onStatusChange={handleStatusChange}
          onClear={handleClearFilters}
          isFiltered={isFiltered}
        />
        <Card liquid className="p-8 text-center">
          <Text variant="ember" size="lg" className="mb-2">
            {error}
          </Text>
          <Button variant="secondary" onClick={() => fetchNotifications(true)}>
            Riprova
          </Button>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!isLoading && notifications.length === 0) {
    return (
      <div className="space-y-4">
        <NotificationFilters
          type={typeFilter}
          status={statusFilter}
          onTypeChange={handleTypeChange}
          onStatusChange={handleStatusChange}
          onClear={handleClearFilters}
          isFiltered={isFiltered}
        />
        <Card liquid className="p-8">
          <EmptyState
            icon="🔔"
            title={isFiltered ? 'Nessuna notifica trovata' : 'Nessuna notifica'}
            description={
              isFiltered
                ? 'Prova a modificare i filtri di ricerca'
                : 'Le notifiche inviate appariranno qui'
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NotificationFilters
        type={typeFilter}
        status={statusFilter}
        onTypeChange={handleTypeChange}
        onStatusChange={handleStatusChange}
        onClear={handleClearFilters}
        isFiltered={isFiltered}
      />

      <Card liquid className="overflow-hidden">
        <InfiniteScroll
          dataLength={notifications.length}
          next={() => fetchNotifications(false)}
          hasMore={hasMore}
          loader={
            <div className="p-4 text-center">
              <Text variant="secondary" size="sm">Caricamento...</Text>
            </div>
          }
          endMessage={
            <div className="p-4 text-center border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200">
              <Text variant="tertiary" size="sm">
                {notifications.length >= MAX_NOTIFICATIONS
                  ? `Visualizzate ${MAX_NOTIFICATIONS} notifiche (limite raggiunto)`
                  : 'Tutte le notifiche caricate'}
              </Text>
            </div>
          }
          scrollableTarget="notification-scroll-container"
        >
          <div className="divide-y divide-slate-700/50 [html:not(.dark)_&]:divide-slate-200">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        </InfiniteScroll>
      </Card>

      {/* Count display */}
      <Text variant="tertiary" size="sm" className="text-center">
        {notifications.length} {notifications.length === 1 ? 'notifica' : 'notifiche'}
        {isFiltered && ' (filtrate)'}
      </Text>
    </div>
  );
}
