/**
 * Request pattern analysis and anomaly detection
 */

export interface RequestPattern {
  endpoint: string;
  method: string;
  frequency: number;
  lastSeen: Date;
  averageResponseTime: number;
  errorRate: number;
  uniqueIPs: Set<string>;
}

export interface AnomalyScore {
  ip: string;
  endpoint: string;
  score: number;
  reasons: string[];
}

/**
 * Analyze request patterns to detect anomalies
 */
export class RequestAnalyzer {
  private patterns: Map<string, RequestPattern> = new Map();
  private requestHistory: Array<{
    ip: string;
    endpoint: string;
    method: string;
    timestamp: Date;
    statusCode: number;
    responseTime: number;
  }> = [];

  /**
   * Record a request
   */
  recordRequest(
    ip: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number
  ): void {
    const key = `${method}:${endpoint}`;
    const timestamp = new Date();

    // Update pattern
    let pattern = this.patterns.get(key);
    if (!pattern) {
      pattern = {
        endpoint,
        method,
        frequency: 0,
        lastSeen: timestamp,
        averageResponseTime: 0,
        errorRate: 0,
        uniqueIPs: new Set(),
      };
      this.patterns.set(key, pattern);
    }

    pattern.frequency++;
    pattern.lastSeen = timestamp;
    pattern.uniqueIPs.add(ip);

    // Update average response time
    pattern.averageResponseTime =
      (pattern.averageResponseTime * (pattern.frequency - 1) + responseTime) /
      pattern.frequency;

    // Track request history (keep last 10000)
    this.requestHistory.push({
      ip,
      endpoint,
      method,
      timestamp,
      statusCode,
      responseTime,
    });

    if (this.requestHistory.length > 10000) {
      this.requestHistory.shift();
    }
  }

  /**
   * Detect anomalies for a specific IP-endpoint combination
   */
  detectAnomalies(ip: string, endpoint: string, method: string = 'GET'): AnomalyScore | null {
    const key = `${method}:${endpoint}`;
    const pattern = this.patterns.get(key);

    if (!pattern || pattern.frequency < 5) {
      // Not enough data
      return null;
    }

    const reasons: string[] = [];
    let score = 0;

    // Check request frequency
    const ipRequests = this.requestHistory.filter(
      r => r.ip === ip && r.endpoint === endpoint && r.method === method
    ).length;

    const expectedFrequency = pattern.frequency / Math.max(1, pattern.uniqueIPs.size);
    if (ipRequests > expectedFrequency * 3) {
      reasons.push('Unusual high request frequency from IP');
      score += 30;
    }

    // Check response time anomalies
    const ipAvgResponseTime =
      this.requestHistory
        .filter(r => r.ip === ip && r.endpoint === endpoint)
        .reduce((sum, r) => sum + r.responseTime, 0) /
        Math.max(1, ipRequests) || 0;

    if (ipAvgResponseTime > pattern.averageResponseTime * 2) {
      reasons.push('Abnormally slow requests from IP');
      score += 15;
    }

    // Check for slow requests (> 10s) - potential scan or attack
    const slowRequests = this.requestHistory.filter(
      r =>
        r.ip === ip &&
        r.endpoint === endpoint &&
        r.responseTime > 10000 &&
        r.statusCode >= 400
    ).length;

    if (slowRequests > 3) {
      reasons.push('Multiple slow error responses');
      score += 25;
    }

    return score > 0
      ? {
          ip,
          endpoint,
          score,
          reasons,
        }
      : null;
  }

  /**
   * Detect brute force attempts
   */
  detectBruteForce(
    endpoint: string,
    method: string,
    failureThreshold: number = 5,
    timeWindow: number = 300000 // 5 minutes in ms
  ): Map<string, number> {
    const key = `${method}:${endpoint}`;
    const cutoffTime = new Date(Date.now() - timeWindow);

    const ipFailures = new Map<string, number>();

    const recentRequests = this.requestHistory.filter(
      r =>
        r.endpoint === endpoint &&
        r.method === method &&
        r.timestamp > cutoffTime &&
        r.statusCode >= 400 // Failed requests
    );

    for (const request of recentRequests) {
      ipFailures.set(
        request.ip,
        (ipFailures.get(request.ip) || 0) + 1
      );
    }

    // Filter to only IPs exceeding threshold
    const result = new Map<string, number>();
    for (const [ip, count] of ipFailures.entries()) {
      if (count >= failureThreshold) {
        result.set(ip, count);
      }
    }

    return result;
  }

  /**
   * Get pattern statistics
   */
  getPatternStats(): {
    totalPatterns: number;
    totalRequests: number;
    averageFrequency: number;
    topEndpoints: Array<{ endpoint: string; frequency: number }>;
  } {
    const stats = {
      totalPatterns: this.patterns.size,
      totalRequests: this.requestHistory.length,
      averageFrequency: this.requestHistory.length / Math.max(1, this.patterns.size),
      topEndpoints: Array.from(this.patterns.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10)
        .map(p => ({
          endpoint: `${p.method} ${p.endpoint}`,
          frequency: p.frequency,
        })),
    };

    return stats;
  }

  /**
   * Clear old patterns (older than specified time)
   */
  clearOldPatterns(hoursOld: number = 24): void {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

    for (const [key, pattern] of this.patterns.entries()) {
      if (pattern.lastSeen < cutoffTime) {
        this.patterns.delete(key);
      }
    }

    // Also clean request history
    this.requestHistory = this.requestHistory.filter(r => r.timestamp > cutoffTime);
  }
}

// Global request analyzer instance
export const requestAnalyzer = new RequestAnalyzer();
