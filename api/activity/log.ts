// Activity Log API for Vercel - logs page visits with IP detection
import type { VercelRequest, VercelResponse } from '@vercel/node';

// In production, store in database. This is in-memory for demo.
let activityLogs: Array<{
  id: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  page: string;
  action: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}> = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get IP address from various headers (Vercel/Cloudflare/proxy)
  const getIpAddress = () => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    }
    return req.headers['x-real-ip'] as string || 
           req.headers['cf-connecting-ip'] as string ||
           req.socket?.remoteAddress || 
           'unknown';
  };

  if (req.method === 'GET') {
    // Return activity logs
    const limit = parseInt(req.query.limit as string) || 100;
    return res.status(200).json({
      logs: activityLogs.slice(-limit).reverse(),
      total: activityLogs.length,
    });
  }

  if (req.method === 'POST') {
    const { page, action, userId, metadata } = req.body;

    const log = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ip: getIpAddress(),
      userAgent: req.headers['user-agent'] || 'unknown',
      page: page || '/',
      action: action || 'page_view',
      userId,
      metadata,
    };

    activityLogs.push(log);

    // Keep only last 1000 logs in memory
    if (activityLogs.length > 1000) {
      activityLogs = activityLogs.slice(-1000);
    }

    return res.status(201).json(log);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
