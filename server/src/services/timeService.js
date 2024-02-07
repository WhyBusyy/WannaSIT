// 현재 시간을 가져오는 함수
function getTime() {
  const date = new Date();
  const dowText = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const actualDay = dowText[date.getDay()];
  const actualHour = date.getHours();
  const actualMin = date.getMinutes();

  return { actualDay, actualHour, actualMin };
}

// 다음 날짜의 요일을 가져오는 함수
function getNextDay(day) {
  const dowText = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  let dayIndex = dowText.indexOf(day);
  dayIndex = (dayIndex + 1) % 7;

  return (dowText[dayIndex]);
}

// 시간 조정함수
function adjustTime(day, hour, min) {
  const validHours = [7, 8, 9, 13, 17, 18, 19];
  let arrivalMin = Math.round(min / 10) * 10;

  if (arrivalMin === 60) {
    hour += 1;
    arrivalMin = 0;
  }

  if (hour === 24) {
    hour = 0;
    day = getNextDay(day);
  }
  
  const arrivalDay = day === "SUN" ? "SAT" : day;
  const arrivalHour = !validHours.includes(hour) ? 13 : hour;

  return { arrivalDay, arrivalHour, arrivalMin };
}

export { getTime, getNextDay, adjustTime };
