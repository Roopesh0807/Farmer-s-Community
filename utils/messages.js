function formatMessage(username, text) {
  // Get the current date and time
  const now = new Date();

  // Format the time in 12-hour format with AM/PM, using the 'Asia/Kolkata' timezone
  const time = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata', // Set the timezone to Indian Standard Time (IST)
  });

  return {
    username,
    text,
    time,
  };
}

module.exports = formatMessage;