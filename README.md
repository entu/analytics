# Entu Analytics

A privacy-focused, self-hosted web analytics platform built with Nuxt.js and OpenSearch.

## Features

- 🔒 **Privacy-focused**: No third-party tracking, all data stays on your servers
- 📊 **Comprehensive tracking**: Page views, user sessions, browser info, geolocation
- 🚀 **Real-time**: Instant data collection and storage
- 🔧 **Easy integration**: Simple JavaScript snippet for any website
- 📱 **Cross-platform**: Works on desktop, mobile, and tablet devices
- 🎯 **Custom events**: Track specific user interactions and events

## What Gets Tracked

### Automatic Tracking
- Page views (including SPA navigation)
- IP address and basic geolocation
- Browser type and version
- Operating system and version
- Device type (Desktop/Mobile/Tablet)
- Screen resolution and viewport size
- Referrer information
- User language preferences
- Session tracking (per browser session)
- Anonymous user tracking (persistent across sessions)

### Custom Event Tracking
Track any custom events like button clicks, form submissions, downloads, etc.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenSearch instance running (local or remote)

### 1. Environment Setup

Create a `.env` file:

```bash
# OpenSearch Configuration
OPENSEARCH_URL=https://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin

# Optional: If using OpenSearch cloud or other auth
# OPENSEARCH_API_KEY=your_api_key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 4. Setup OpenSearch

The application will automatically create the necessary OpenSearch index (`analytics-events`) on first run.

If you need to manually create it or are using OpenSearch Dashboards:

```json
PUT /analytics-events
{
  "mappings": {
    "properties": {
      "timestamp": { "type": "date" },
      "site_id": { "type": "keyword" },
      "page_url": { "type": "text" },
      "domain": { "type": "keyword" },
      "path": { "type": "keyword" },
      "query": { "type": "text" },
      "user_agent": { "type": "text" },
      "ip_address": { "type": "ip" },
      "browser": { "type": "keyword" },
      "os": { "type": "keyword" },
      "device_type": { "type": "keyword" },
      "session_id": { "type": "keyword" },
      "event_type": { "type": "keyword" }
    }
  }
}
```

## Integration with Your Website

### Simple Integration

Add this single script tag to your website's `<head>` section:

```html
<script src="https://analytics.entu.ee/ea.js" data-site="your-unique-site-id" async></script>
```

The script will automatically:
- Extract the site ID from the `data-site` attribute
- Determine the correct API endpoint from the script's source URL
- Start tracking page views and user interactions

## Custom Event Tracking

Once the script is loaded, you can track custom events:

```javascript
// Track a button click
window.analytics.track('button_click', {
  button_name: 'signup',
  page: 'homepage'
});

// Track a download
window.analytics.track('download', {
  file_name: 'whitepaper.pdf',
  file_type: 'pdf'
});

// Track form submission
window.analytics.track('form_submit', {
  form_name: 'contact',
  success: true
});

// Manually track a page view (useful for SPAs)
window.analytics.trackPageView();
```

## API Endpoints

### POST `/api/track`
Receives and stores analytics events.

**Request Body:** JSON object with event data

## Data Structure

Each analytics event stored in OpenSearch contains:

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "site_id": "my-website",
  "page_url": "https://example.com/page",
  "domain": "example.com",
  "path": "/page",
  "query": "?utm_source=google",
  "page_title": "Page Title",
  "referrer": "https://google.com",
  "user_agent": "Mozilla/5.0...",
  "ip_address": "192.168.1.100",
  "browser": "Chrome",
  "browser_version": "91.0",
  "os": "Windows",
  "os_version": "10",
  "device_type": "Desktop",
  "screen_resolution": "1920x1080",
  "viewport_size": "1200x800",
  "language": "en-US",
  "session_id": "session_123...",
  "user_id": "user_456...",
  "event_type": "pageview",
  "event_name": "button_click",
  "event_data": { "button_name": "signup" }
}
```

## OpenSearch Queries

### View Recent Page Views
```json
GET /analytics-events/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "site_id": "your-site-id" } },
        { "term": { "event_type": "pageview" } }
      ]
    }
  },
  "sort": [{ "timestamp": { "order": "desc" } }],
  "size": 100
}
```

### Popular Pages
```json
GET /analytics-events/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "site_id": "your-site-id" } },
        { "term": { "event_type": "pageview" } }
      ]
    }
  },
  "aggs": {
    "popular_pages": {
      "terms": {
        "field": "path.keyword",
        "size": 10
      }
    }
  }
}
```

### Browser Statistics
```json
GET /analytics-events/_search
{
  "query": { "term": { "site_id": "your-site-id" } },
  "aggs": {
    "browsers": {
      "terms": { "field": "browser" }
    }
  }
}
```

## Privacy Features

- **No cookies**: Uses sessionStorage and localStorage for session tracking
- **IP anonymization**: Store hashed IPs or configure IP anonymization
- **GDPR compliant**: No personal data stored by default
- **Self-hosted**: All data remains on your infrastructure
- **Opt-out support**: Easy to implement user opt-out functionality

## License

MIT License - see LICENSE file for details.