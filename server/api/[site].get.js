export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const siteId = getRouterParam(event, 'site')

  if (!siteId) {
    return {}
  }

  const db = await connectMongoDb()

  // Check if site exists
  const site = await db.collection('sites').findOne({ _id: objectId(siteId) }, { projection: { name: true, collection: true } })

  if (!site) {
    return {}
  }

  const collection = db.collection(site.collection)

  // Get date range (default: last 30 days)
  const days = parseInt(query.days) || 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const dateFilter = { date: { $gte: startDate } }
  const pageviewFilter = { ...dateFilter, 'event.type': 'pageview' }
  const eventFilter = { ...dateFilter, 'event.type': { $ne: 'pageview' } }

  // Determine time slot granularity based on period
  const getDateGroupExpression = () => {
    if (days === 1) {
      // Hourly: %Y-%m-%dT%H:00:00.000Z
      return {
        $dateToString: {
          format: '%Y-%m-%dT%H:00:00.000Z',
          date: '$date'
        }
      }
    }
    else if (days <= 7) {
      // 6-hour slots: floor hour to nearest 6-hour block
      return {
        $concat: [
          { $dateToString: { format: '%Y-%m-%dT', date: '$date' } },
          {
            $switch: {
              branches: [
                { case: { $lt: [{ $hour: '$date' }, 6] }, then: '00' },
                { case: { $lt: [{ $hour: '$date' }, 12] }, then: '06' },
                { case: { $lt: [{ $hour: '$date' }, 18] }, then: '12' }
              ],
              default: '18'
            }
          },
          ':00:00.000Z'
        ]
      }
    }
    else if (days <= 90) {
      // Daily: %Y-%m-%dT00:00:00.000Z
      return {
        $dateToString: {
          format: '%Y-%m-%dT00:00:00.000Z',
          date: '$date'
        }
      }
    }
    else {
      // Weekly: year-week format (ISO week)
      return {
        $concat: [
          { $toString: { $isoWeekYear: '$date' } },
          '-W',
          {
            $cond: {
              if: { $lt: [{ $isoWeek: '$date' }, 10] },
              then: { $concat: ['0', { $toString: { $isoWeek: '$date' } }] },
              else: { $toString: { $isoWeek: '$date' } }
            }
          }
        ]
      }
    }
  }

  const dateGroupExpr = getDateGroupExpression()

  // Run all aggregations in parallel
  const [
    totalPageviews,
    totalEvents,
    totalVisitors,
    totalSessions,
    dailyPageviews,
    dailyEvents,
    dailyVisitors,
    dailySessions,
    topPages,
    topReferrers,
    topCountries,
    topOS,
    topBrowsers,
    topEvents,
    recentPageviews
  ] = await Promise.all([
    // Total pageviews (excluding events)
    collection.countDocuments(pageviewFilter),

    // Total events
    collection.countDocuments(eventFilter),

    // Unique visitors (by user ID)
    collection.distinct('user', dateFilter).then((users) => users.length),

    // Unique sessions
    collection.distinct('session', dateFilter).then((sessions) => sessions.length),

    // Daily/Hourly pageviews (based on granularity)
    collection.aggregate([
      { $match: pageviewFilter },
      {
        $group: {
          _id: dateGroupExpr,
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray(),

    // Daily/Hourly events
    collection.aggregate([
      { $match: eventFilter },
      {
        $group: {
          _id: dateGroupExpr,
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray(),

    // Daily/Hourly unique visitors
    collection.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: dateGroupExpr,
            user: '$user'
          }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray(),

    // Daily/Hourly unique sessions
    collection.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: dateGroupExpr,
            session: '$session'
          }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray(),

    // Top pages
    collection.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$path', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray(),

    // Top referrers
    collection.aggregate([
      { $match: { ...dateFilter, referrer: { $ne: '', $exists: true } } },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray(),

    // Top countries
    collection.aggregate([
      { $match: { ...dateFilter, country: { $exists: true, $ne: null } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray(),

    // Top OS
    collection.aggregate([
      { $match: { ...dateFilter, 'os.name': { $exists: true } } },
      { $group: { _id: '$os.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray(),

    // Top browsers
    collection.aggregate([
      { $match: { ...dateFilter, 'browser.name': { $exists: true } } },
      { $group: { _id: '$browser.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray(),

    // Top events
    collection.aggregate([
      { $match: eventFilter },
      { $group: { _id: '$event.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray(),

    // Recent pageviews (excluding events)
    collection.find(pageviewFilter)
      .sort({ date: -1 })
      .limit(20)
      .project({ _id: 0, date: 1, path: 1, title: 1, country: 1, browser: 1 })
      .toArray()
  ])

  // Generate all time slots for the period based on granularity
  function fillTimeSlots (data) {
    const dataMap = new Map(data.map((d) => [d._id, d.count]))
    const result = []
    const now = new Date()

    if (days === 1) {
      // Hourly slots
      const interval = 60 * 60 * 1000 // 1 hour
      const slots = days * 24

      for (let i = slots - 1; i >= 0; i--) {
        const slotDate = new Date(now.getTime() - i * interval)
        slotDate.setUTCMinutes(0, 0, 0)
        const key = slotDate.toISOString().slice(0, 13) + ':00:00.000Z'
        result.push({ date: key, count: dataMap.get(key) || 0 })
      }
    }
    else if (days <= 7) {
      // 6-hour slots
      const interval = 6 * 60 * 60 * 1000 // 6 hours
      const slots = Math.ceil((days * 24) / 6)

      for (let i = slots - 1; i >= 0; i--) {
        const slotDate = new Date(now.getTime() - i * interval)
        // Round down to nearest 6-hour block
        const hour = slotDate.getUTCHours()
        const roundedHour = Math.floor(hour / 6) * 6
        slotDate.setUTCHours(roundedHour, 0, 0, 0)
        const hourStr = roundedHour.toString().padStart(2, '0')
        const key = slotDate.toISOString().slice(0, 11) + hourStr + ':00:00.000Z'
        // Avoid duplicates from rounding
        if (result.length === 0 || result[result.length - 1].date !== key) {
          result.push({ date: key, count: dataMap.get(key) || 0 })
        }
      }
    }
    else if (days <= 90) {
      // Daily slots
      const interval = 24 * 60 * 60 * 1000 // 1 day

      for (let i = days - 1; i >= 0; i--) {
        const slotDate = new Date(now.getTime() - i * interval)
        slotDate.setUTCHours(0, 0, 0, 0)
        const key = slotDate.toISOString().slice(0, 10) + 'T00:00:00.000Z'
        result.push({ date: key, count: dataMap.get(key) || 0 })
      }
    }
    else {
      // Weekly slots (ISO week format: YYYY-WXX)
      const interval = 7 * 24 * 60 * 60 * 1000 // 1 week
      const weeks = Math.ceil(days / 7)

      for (let i = weeks - 1; i >= 0; i--) {
        const slotDate = new Date(now.getTime() - i * interval)
        // Get ISO week number
        const yearStart = new Date(Date.UTC(slotDate.getUTCFullYear(), 0, 1))
        const dayOfYear = Math.floor((slotDate - yearStart) / (24 * 60 * 60 * 1000))
        const weekNum = Math.ceil((dayOfYear + yearStart.getUTCDay() + 1) / 7)
        const isoWeek = weekNum.toString().padStart(2, '0')
        const key = `${slotDate.getUTCFullYear()}-W${isoWeek}`
        // Avoid duplicates
        if (result.length === 0 || result[result.length - 1].date !== key) {
          result.push({ date: key, count: dataMap.get(key) || 0 })
        }
      }
    }

    return result
  }

  return {
    name: site.name,
    days,
    totalPageviews,
    totalEvents,
    totalVisitors,
    totalSessions,
    dailyPageviews: fillTimeSlots(dailyPageviews),
    dailyEvents: fillTimeSlots(dailyEvents),
    dailyVisitors: fillTimeSlots(dailyVisitors),
    dailySessions: fillTimeSlots(dailySessions),
    topPages: topPages.map((p) => ({ label: p._id, value: p.count })),
    topReferrers: topReferrers.map((r) => ({ label: r._id, value: r.count })),
    topCountries: topCountries.map((c) => ({ label: c._id, value: c.count })),
    topOS: topOS.map((o) => ({ label: o._id, value: o.count })),
    topBrowsers: topBrowsers.map((b) => ({ label: b._id, value: b.count })),
    topEvents: topEvents.map((e) => ({ label: e._id, value: e.count })),
    recentPageviews
  }
})
