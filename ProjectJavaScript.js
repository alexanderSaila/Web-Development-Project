const scheduleSection = document.getElementById("schedule-section")

const weekContainer = document.createElement("div");
weekContainer.className = "week-container";

const weekNames = [
    "Mon", "Tue", "Wed",
    "Thu", "Fri", "Sat", "Sun"];

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function displayMonthOnScreen(month) {
    displayCalendarName(month);
    weekContainer.replaceChildren();

    year = new Date().getFullYear()
    const startDate = new Date(year, month - 1, 1);
    const numberOfDaysInMonth = new Date(year, month, 0).getDate();

    // Set the start day of each week 6 = Monday
    const startDay = (startDate.getDay() + 6) % 7;

    let currentWeekDiv = document.createElement("div");
    currentWeekDiv.classList.add("day-container");

    const totalDays = startDay + numberOfDaysInMonth;

    for (let i = 0; i < totalDays; i++) {
        const tempDay = document.createElement("section");
        tempDay.className = "day-section";
        
        const dayName = weekNames[i % 7];

        if (i < startDay) {
            const previousMonth = new Date(year, month-1, -1);
            const offset = previousMonth.getDate() - (startDay - i) + 2;
            makeDayEmpty(tempDay, offset, month-1, dayName);
        } else {
            const dayNumber = i - startDay + 1;

            createDayHeader(tempDay, dayNumber, month, dayName);
        }

        currentWeekDiv.append(tempDay);

        // start a new week after 7 days have been added
        if (currentWeekDiv.children.length === 7) {
            weekContainer.append(currentWeekDiv);
            currentWeekDiv = document.createElement("div");
            currentWeekDiv.classList.add("day-container");
        }
    }

    if (currentWeekDiv.children.length > 0) {
        const missingDays = 7 - currentWeekDiv.children.length;
        for (let i = 0; i < missingDays; i++) {
            const tempDay = document.createElement("section");
            tempDay.className = "day-section";
            makeDayEmpty(tempDay, i+1, month+1);
            currentWeekDiv.append(tempDay);
        }
        weekContainer.append(currentWeekDiv);
    }
}

function makeDayEmpty(dayElement, offset, month, dayName){
    dayElement.style.background = "#C9C9C9";
    dayElement.style.border = "1px dashed gray"

    const dayHeader = document.createElement("p");
    dayHeader.style.textAlign = "center";
    dayHeader.style.marginTop = "5px";
    dayHeader.textContent = `${dayName} ${offset}/${month}`;

    dayElement.append(dayHeader);
}

function createDayHeader(dayElement, dayNumber, month, dayName){
    const dayHeader = document.createElement("p");
    dayHeader.style.textAlign = "center";
    dayHeader.style.marginTop = "5px";
    dayHeader.textContent = `${dayName} ${dayNumber}/${month}`;
    
    dayElement.append(dayHeader);
}


function displayCalendarName(month){
    const calendarHeader = document.getElementById("month-name");
    calendarHeader.textContent = monthNames[month-1];
}

const getCurrentMonthNumber = () => {return new Date().getMonth() +1};
let selectedMonth = getCurrentMonthNumber();

displayMonthOnScreen(selectedMonth);

const previousMonthButton = document.getElementById("previous-month-button");
const nextMonthButton = document.getElementById("next-month-button");

previousMonthButton.addEventListener("click", () => {displayMonthOnScreen(--selectedMonth)});
nextMonthButton.addEventListener("click", () => {displayMonthOnScreen(++selectedMonth)});

scheduleSection.append(weekContainer);