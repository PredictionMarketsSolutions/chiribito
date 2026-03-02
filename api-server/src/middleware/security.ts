import type { Request, Response, NextFunction } from 'express';
import {
  securityMonitor,
  SecurityEventType,
} from '../utils/security-monitor';
import { requestAnalyzer } from '../utils/request-analyzer';
import { getClientIP } from '../utils/ip-security';
import logger from '../config/logger';

/**
 * Comprehensive security middleware
 * Integrates monitoring, analysis, and event recording
 */

export interface SecurityOptions {
  enableMonitoring?: boolean;
  enableAnalysis?: boolean;
  enableAudit?: boolean;
  anomalyThreshold?: number;
}

export function securityMiddleware(options: SecurityOptions = {}) {
  const {
    enableMonitoring = true,
    enableAnalysis = true,
    enableAudit = true,
    anomalyThreshold = 50,
  } = options;

  return (req: Request & { startTime?: Date }, res: Response, next: NextFunction) => {
    req.startTime = new Date();
    const clientIP = getClientIP(req);

    // Record start of request
    if (enableMonitoring || enableAnalysis) {
      logger.debug('Security check', {
        method: req.method,
        path: req.path,
        ip: clientIP,
      });
    }

    // Intercept response to capture status code and response time
    const originalJson = res.json;
    const originalSend = res.send;

    const captureResponse = (fn: any) => {
      return function (this: Response, data: any) {
        if (enableMonitoring || enableAnalysis) {
          const responseTime = Date.now() - (req.startTime?.getTime() || 0);
          const statusCode = res.statusCode;

          // Record request in analyzer
          if (enableAnalysis) {
            requestAnalyzer.recordRequest(
              clientIP,
              req.path,
              req.method,
              statusCode,
              responseTime
            );

            // Check for anomalies
            const anomaly = requestAnalyzer.detectAnomalies(clientIP, req.path, req.method);
            if (anomaly && anomaly.score > anomalyThreshold) {
              securityMonitor.recordEvent(
                SecurityEventType.SUSPICIOUS_REQUEST,
                'medium',
                clientIP,
                {
                  endpoint: req.path,
                  anomalyScore: anomaly.score,
                  reasons: anomaly.reasons,
                  method: req.method,
                }
              );
            }
          }

          // Check for brute force
          if (statusCode >= 400 && req.path.includes('/auth')) {
            const bruteForceIPs = requestAnalyzer.detectBruteForce(
              req.path,
              req.method,
              5,
              300000 // 5 minutes
            );

            if (bruteForceIPs.has(clientIP)) {
              const attempts = bruteForceIPs.get(clientIP) || 0;
              securityMonitor.recordEvent(
                SecurityEventType.BRUTE_FORCE_ATTEMPT,
                attempts > 10 ? 'high' : 'medium',
                clientIP,
                {
                  endpoint: req.path,
                  attempts,
                  method: req.method,
                  timeWindow: '5 minutes',
                }
              );
            }
          }
        }

        // Call original function
        return fn.call(this, data);
      };
    };

    res.json = captureResponse(originalJson);
    res.send = captureResponse(originalSend);

    next();
  };
}

/**
 * Middleware to provide security audit logging
 */
export function auditLoggingMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Add audit helpers to request
  (req as any).audit = {
    logAction: (action: string, details: any) => {
      const clientIP = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'unknown';

      logger.info(`AUDIT: ${action}`, {
        action,
        ip: clientIP,
        userAgent,
        path: req.path,
        method: req.method,
        ...details,
      });
    },
  };

  next();
}

/**
 * Middleware to block suspicious user agents
 */
export function suspiciousUserAgentMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();

  const suspiciousPatterns = [
    /bot(?!ify)/i,
    /crawler/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /nikto/i,
    /nmap/i,
    /sqlmap/i,
    /nikto/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      const clientIP = getClientIP(req);

      securityMonitor.recordEvent(
        SecurityEventType.SUSPICIOUS_REQUEST,
        'low',
        clientIP,
        {
          reason: 'Suspicious user agent detected',
          userAgent,
          path: req.path,
        }
      );

      // Don't block, just log and continue (adjust based on your requirements)
      logger.warn('Suspicious user agent detected', { userAgent, ip: clientIP });
    }
  }

  next();
}
