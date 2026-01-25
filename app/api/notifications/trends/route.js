/**
 * Notification Trends API
 *
 * Returns daily notification trends for visualization.
 *
 * GET /api/notifications/trends?days=7
 *
 * Response:
 * {
 *   success: true,
 *   trends: {
 *     daily: [{ date, total, sent, failed, deliveryRate }, ...],
 *     summary: { totalNotifications, averageDeliveryRate, trend }
 *   },
 *   period: { start, end, days }
 * }
 */

import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import { startOfDay, format, eachDayOfInterval, subDays } from 'date-fns';
import { withAuthAndErrorHandler } from '@/lib/core';

export const dynamic = 'force-dynamic';

async function getTrendsHandler(req) {
  const { searchParams } = new URL(req.url);

  // Get days parameter (default 7, max 30)
  let days = parseInt(searchParams.get('days') || '7', 10);
  if (days < 1 || days > 30) days = 7;

  const db = getAdminFirestore();

  // Calculate date range
  const endDate = startOfDay(new Date());
  const startDate = startOfDay(subDays(endDate, days - 1));

  // Query notification logs for the period
  const snapshot = await db
    .collection('notificationLogs')
    .where('timestamp', '>=', Timestamp.fromDate(startDate))
    .get();

  // Create array of all days in range
  const allDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Initialize daily data structure
  const dailyMap = {};
  allDays.forEach((day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    dailyMap[dateKey] = {
      date: dateKey,
      total: 0,
      sent: 0,
      failed: 0,
      deliveryRate: 0,
    };
  });

  // Aggregate data by day
  snapshot.forEach((doc) => {
    const data = doc.data();
    const docDate = data.timestamp.toDate();
    const dateKey = format(startOfDay(docDate), 'yyyy-MM-dd');

    if (dailyMap[dateKey]) {
      dailyMap[dateKey].total++;

      if (data.status === 'sent' || data.status === 'delivered') {
        dailyMap[dateKey].sent++;
      } else if (data.status === 'failed') {
        dailyMap[dateKey].failed++;
      }
    }
  });

  // Calculate delivery rates
  Object.values(dailyMap).forEach((day) => {
    if (day.total > 0) {
      day.deliveryRate = (day.sent / day.total) * 100;
    }
  });

  // Convert to sorted array (oldest first)
  const daily = Object.values(dailyMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Calculate summary
  const totalNotifications = daily.reduce((sum, day) => sum + day.total, 0);
  let averageDeliveryRate = 0;

  if (totalNotifications > 0) {
    const totalSent = daily.reduce((sum, day) => sum + day.sent, 0);
    averageDeliveryRate = (totalSent / totalNotifications) * 100;
  }

  // Calculate trend (last 3 days vs previous 4 days)
  let trend = 'stable';

  if (days >= 7) {
    const recent3Days = daily.slice(-3);
    const previous4Days = daily.slice(-7, -3);

    const recent3Avg =
      recent3Days.reduce((sum, day) => sum + day.deliveryRate, 0) / 3;
    const previous4Avg =
      previous4Days.reduce((sum, day) => sum + day.deliveryRate, 0) / 4;

    const diff = recent3Avg - previous4Avg;

    if (diff > 5) {
      trend = 'improving';
    } else if (diff < -5) {
      trend = 'declining';
    }
  }

  return NextResponse.json({
    success: true,
    trends: {
      daily,
      summary: {
        totalNotifications,
        averageDeliveryRate: parseFloat(averageDeliveryRate.toFixed(1)),
        trend,
      },
    },
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      days,
    },
  });
}

export const GET = withAuthAndErrorHandler(getTrendsHandler);
