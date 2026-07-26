const getDateRangeFromTimeRange = (timeRange) => {
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const start = new Date(now);

  switch (timeRange) {
    case 'DAY':
      break;
    case 'WEEK': {
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diff);
      break;
    }
    case 'MONTH':
      start.setDate(1);
      break;
    case 'YEAR':
      start.setMonth(0, 1);
      break;
    default:
      return {};
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate,
  };
};

module.exports = {
  getDateRangeFromTimeRange,
};
