const scheduleSection = document.getElementById("schedule-section")

let selectedDay = null;

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

    // Set the start day of each week
    const startDay = (startDate.getDay() + 6) % 7;

    let currentWeekDiv = document.createElement("div");
    currentWeekDiv.classList.add("day-container");

    const totalDays = startDay + numberOfDaysInMonth;

    for (let i = 0; i < totalDays; i++) {
        const tempDay = document.createElement("section");
        tempDay.className = "day-section";
        
        const dayName = weekNames[i % 7];

        // check if day belongs to previous month and create header.
        if (i < startDay) {
            const previousMonth = new Date(year, month-1, -1);
            const offset = previousMonth.getDate() - (startDay - i) + 2;
            makeEmptyDay(tempDay, dayName, offset, month-1);
        } else {
            const dayNumber = i - startDay + 1;

            makeRegularDay(tempDay, dayName, dayNumber, month);
        }

        currentWeekDiv.append(tempDay);

        // start a new week after 7 days have been added
        if (currentWeekDiv.children.length === 7) {
            weekContainer.append(currentWeekDiv);
            currentWeekDiv = document.createElement("div");
            currentWeekDiv.classList.add("day-container");
        }
    }

    // fill out the remaining days
    if (currentWeekDiv.children.length > 0) {
        const missingDays = 7 - currentWeekDiv.children.length;
        for (let i = 0; i < missingDays; i++) {
            const tempDay = document.createElement("section");
            tempDay.className = "day-section";

            const dayName = weekNames[7-missingDays+i];

            makeEmptyDay(tempDay, dayName, i+1, month+1);

            currentWeekDiv.append(tempDay);
        }
        weekContainer.append(currentWeekDiv);
    }
}

function makeEmptyDay(dayElement, dayName, offset, month){
    dayElement.style.background = "#C9C9C9";
    dayElement.style.border = "1px dashed gray"

    createDayHeader(dayElement, dayName, offset, month);
}

function makeRegularDay(dayElement, dayName, dayNumber, month){
    createDayHeader(dayElement, dayName, dayNumber, month);

    dayElement.setAttribute("id", `${dayNumber}-${month}`)

    // add different event listeners
    dayElement.addEventListener("click", () =>{
        changeFocusedDay(dayElement);
    });
    dayElement.addEventListener("mouseenter", () => {
        dayElement.style.background = "#91FFB7";
        dayElement.style.border = "1px solid green";
    })
    dayElement.addEventListener("mouseleave", () => {
        dayElement.style.background = "";
        dayElement.style.border = "";
    })
}

function createDayHeader(dayElement, dayName, dayNumber, month){
    const dayHeader = document.createElement("p");
    dayHeader.classList.add("day-header");
    dayHeader.textContent = `${dayName} ${dayNumber}/${month}`;
    
    dayElement.append(dayHeader);
}

function displayCalendarName(month){
    const calendarHeader = document.getElementById("month-name");
    calendarHeader.textContent = monthNames[month-1];
}

function changeFocusedDay(dayElement){
    if(selectedDay !== null){
        selectedDay.classList.remove("selected-day");
        selectedDay.querySelector(".add-item-button")?.remove()
    }
    selectedDay = dayElement;

    dayElement.classList.add("selected-day");

    const addButton = document.createElement("button");
    addButton.className = "add-item-button";
    addButton.textContent = "+";
    
    dayElement.append(addButton);
    
}



const getCurrentMonthNumber = () => {return new Date().getMonth() +1};
let selectedMonth = getCurrentMonthNumber();

displayMonthOnScreen(selectedMonth);

const previousMonthButton = document.getElementById("previous-month-button");
const nextMonthButton = document.getElementById("next-month-button");

previousMonthButton.addEventListener("click", () => {displayMonthOnScreen(--selectedMonth)});
nextMonthButton.addEventListener("click", () => {displayMonthOnScreen(++selectedMonth)});

scheduleSection.append(weekContainer);