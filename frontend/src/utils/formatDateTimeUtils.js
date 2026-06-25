// formats date in format "1st January, 2005 13:00"
export const formatDateTime = (isoDate) => {
  // convert ISO date string to Date object
  const dateObj = new Date(isoDate);

  // check if date is valid
  if (dateObj.getTime() === 0) {
    return null;
  }

  // get date components from Date object (00:00:00.000Z)
  const hours = dateObj.getUTCHours();
  const minutes = dateObj.getUTCMinutes();
  const seconds = Math.round(
    dateObj.getUTCSeconds() + dateObj.getUTCMilliseconds() / 1000
  );

  // format date components
  const day = dateObj.getUTCDate();
  const month = dateObj.toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  const year = dateObj.getUTCFullYear();

  // add suffix to day of the month (st, nd, rd, th)
  const daySuffix = (day) => {
    const j = day % 10,
      k = day % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const formattedDay = `${day}${daySuffix(day)}`;

  // format time components
  const formattedTime = `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}`;

  // return formatted date string
  return `${formattedDay} ${month}, ${year} ${formattedTime}`;
};
