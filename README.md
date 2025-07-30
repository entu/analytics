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
- **Page views**: Automatic tracking on page load and SPA navigation
- **Site identification**: From `data-site` attribute
- **URL data**: Domain, path, query parameters, and page title
- **Referrer**: Previous page that led to current page
- **Browser info**: Name, version, and full user agent string
- **Operating system**: Name, version, and mobile device detection
- **Client IP**: For basic geolocation (server-side capture)
- **Screen dimensions**: Physical screen resolution
- **Viewport size**: Current browser window dimensions
- **Language**: User's preferred language setting
- **Session tracking**: Unique session ID per browser session (sessionStorage)
- **User tracking**: Persistent anonymous user ID (localStorage)

### Custom Event Tracking
Track any custom events like button clicks, form submissions, downloads, etc.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenSearch instance running (local or remote)

### 1. Environment Setup

Copy the example environment file and configure your OpenSearch connection:

```bash
cp .env.example .env
```

Then edit `.env` with your OpenSearch configuration:

```bash
# OpenSearch Configuration
NUXT_OPENSEARCH_HOSTNAME=localhost
NUXT_OPENSEARCH_PORT=9200
NUXT_OPENSEARCH_USERNAME=admin
NUXT_OPENSEARCH_PASSWORD=admin
```

### 2. Start the Development Server

```bash
# Development (with hot reload)
npm run dev

# Production build and start
npm run build
npm start

# Generate static site
npm run generate

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Integration with Your Website

### Simple Integration

Add this single script tag to your website's `<head>` section:

```html
<script src="https://your-analytics-domain.com/ea.min.js" data-site="your-unique-site-id" crossorigin="anonymous" defer></script>
```

Replace `your-analytics-domain.com` with your actual domain where this analytics service is hosted.

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
  "@timestamp": "2025-07-29T10:30:00.000Z",
  "site": "my-website",
  "domain": "example.com",
  "path": "/page",
  "query": "?utm_source=google",
  "title": "Page Title",
  "referrer": "https://google.com",
  "browser": {
    "name": "Chrome",
    "version": "91.0",
    "agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..."
  },
  "os": {
    "name": "Windows",
    "version": "10",
    "mobile": false
  },
  "ip": "192.168.1.100",
  "screen": "1920x1080",
  "viewport": "1200x800",
  "language": "en-US",
  "session": "session_abc123_1234567890",
  "user": "user_def456_1234567890",
  "event": {
    "type": "pageview",
    "button_name": "signup"
  }
}
```

### Index Naming Convention

Events are stored in monthly indices with the format: `analytics-{site}-{year}-{month}`

Examples:
- `analytics-my-website-2025-07`
- `analytics-blog-2025-08`

## OpenSearch Queries

### View Recent Page Views
```json
GET /analytics-my-website-2025-07/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "site": "my-website" } },
        { "term": { "event.type": "pageview" } }
      ]
    }
  },
  "sort": [{ "@timestamp": { "order": "desc" } }],
  "size": 100
}
```

### Popular Pages
```json
GET /analytics-my-website-2025-07/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "site": "my-website" } },
        { "term": { "event.type": "pageview" } }
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
GET /analytics-my-website-2025-07/_search
{
  "query": { "term": { "site": "my-website" } },
  "aggs": {
    "browsers": {
      "terms": { "field": "browser.name.keyword" }
    }
  }
}
```

### Operating System Distribution
```json
GET /analytics-my-website-2025-07/_search
{
  "query": { "term": { "site": "my-website" } },
  "aggs": {
    "operating_systems": {
      "terms": { "field": "os.name.keyword" }
    },
    "mobile_vs_desktop": {
      "terms": { "field": "os.mobile" }
    }
  }
}
```

## Privacy Features

- **No cookies**: Uses sessionStorage and localStorage for session tracking
- **GDPR compliant**: No personal data stored by default
- **Self-hosted**: All data remains on your infrastructure
- **Opt-out support**: Easy to implement user opt-out functionality

## License

MIT License - see LICENSE file for details.