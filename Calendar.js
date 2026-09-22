class Calendar {

    static monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    static weekNames = [
        "Mon", "Tue", "Wed",
        "Thu", "Fri", "Sat", "Sun"
    ];

    selectedDay = null;
    selectedDate = null;
    scheduleSection = null;
    weekContainer = null;
    previousMonthButton = null;
    nextMonthButton = null;

    constructor() {
        this.selectedDate = new Date();
        this.scheduleSection = document.getElementById("schedule-section");
        this.previousMonthButton = document.getElementById("previous-month-button");
        this.nextMonthButton = document.getElementById("next-month-button");

        this.weekContainer = document.createElement("div");
        this.scheduleSection.append(this.weekContainer);

        this.previousMonthButton.addEventListener("click", () => {
            this.selectedDate.setMonth(this.selectedDate.getMonth() - 1);
            this.displayMonth();
        });
        this.nextMonthButton.addEventListener("click", () => {
            this.selectedDate.setMonth(this.selectedDate.getMonth() + 1);
            this.displayMonth();
        });

        this.displayMonth();
    }

    displayMonth() {
        const month = this.selectedDate.getMonth() + 1;
        const year = this.selectedDate.getFullYear();

        this.displayCalendarName(month - 1);
        this.weekContainer.replaceChildren();

        const startDate = new Date(year, month - 1, 1);
        const numberOfDaysInMonth = new Date(year, month, 0).getDate();

        // Tells me how many empty days we need in order to always start each week on a monday
        const startDay = (startDate.getDay() + 6) % 7;

        let currentWeekDiv = document.createElement("div");
        currentWeekDiv.classList.add("day-container");

        const totalDays = startDay + numberOfDaysInMonth;

        for (let i = 0; i < totalDays; i++) {
            let tempDay = null;

            const dayName = Calendar.weekNames[i % 7];

            // check if day belongs to previous month.
            if (i < startDay) {
                const previousMonth = new Date(year, month - 1, -1); // last day of previous month
                const offset = previousMonth.getDate() - (startDay - i) + 2;

                tempDay = this.createDayNode(dayName, offset, month - 1, true);
            } else {
                const dayNumber = i - startDay + 1;

                tempDay = this.createDayNode(dayName, dayNumber, month, false);
            }

            currentWeekDiv.append(tempDay);

            // start a new week container after 7 days have been added
            if (currentWeekDiv.children.length === 7) {
                this.weekContainer.append(currentWeekDiv);
                currentWeekDiv = document.createElement("div");
                currentWeekDiv.classList.add("day-container");
            }
        }

        // fill out the remaining days
        if (currentWeekDiv.children.length > 0) {
            const missingDays = 7 - currentWeekDiv.children.length;

            for (let i = 0; i < missingDays; i++) {

                const dayName = Calendar.weekNames[7 - missingDays + i];
                const tempDay = this.createDayNode(dayName, i + 1, month + 1, true);
                currentWeekDiv.append(tempDay);
            }
            this.weekContainer.append(currentWeekDiv);
        }
    }

    displayCalendarName(month) {
        const calendarHeader = document.getElementById("month-name");
        calendarHeader.textContent = Calendar.monthNames[month];
    }

    createDayNode(dayName, dayNumber, month, isEmpty) {
        const daySection = document.createElement("section");
        daySection.setAttribute("id", `${dayNumber}-${month}-${this.selectedDate.getFullYear()}`);
        daySection.classList.add("day-section");

        const dayHeader = document.createElement("p");
        dayHeader.classList.add("day-header");
        dayHeader.textContent = `${dayName} ${dayNumber}/${month}`;
        daySection.append(dayHeader);

        if (!isEmpty) {
            daySection.addEventListener("click", () => {
                this.changeFocusedDay(daySection);
            });
            daySection.addEventListener("mouseenter", () => {
                daySection.style.background = "#91FFB7";
                daySection.style.border = "1px solid green";
            })
            daySection.addEventListener("mouseleave", () => {
                daySection.style.background = "";
                daySection.style.border = "";
            })
        }
        else {
            daySection.style.background = "#C9C9C9";
            daySection.style.border = "1px dashed gray"
        }

        return daySection;
    }

    changeFocusedDay(dayElement) {

        if (this.selectedDay === dayElement) { return; }

        this.#clearFocusedDay();

        this.selectedDay = dayElement;

        this.selectedDay.classList.add("selected-day");

        this.selectedDay.append(this.#createAddButton());
    }

    #clearFocusedDay() {
        if(this.selectedDay === null){
            return;
        }
        this.selectedDay.classList.remove("selected-day");
        this.selectedDay.querySelector(".add-item-button")?.remove();
        this.selectedDay.querySelector(".input-field")?.remove();
    }

    #createAddButton(){
        const addButton = document.createElement("button");
        addButton.className = "add-item-button";
        addButton.textContent = "+";

        addButton.addEventListener("click", (e) => {
            e.stopPropagation();

            const inputField = this.#createInputField();
            if (inputField !== null) {
                this.selectedDay.insertBefore(inputField, addButton);
                inputField.focus();
            }
        })

        return addButton;
    }

    #createInputField() {
        if (this.selectedDay.querySelector(".input-field") == null) {
            const inputField = document.createElement("input");
            inputField.className = "input-field";
            inputField.type = "text";
            inputField.placeholder = "Enter Task"

            inputField.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    const finishedText = document.createElement("p");
                    finishedText.classList.add("day-task");
                    finishedText.textContent = inputField.value.trim();

                    this.selectedDay.insertBefore(finishedText, inputField);
                    inputField.remove();
                }
            });
            inputField.addEventListener("keydown", (e) => {
                if(e.key === "Escape"){
                    inputField.remove();
                }
            })

            return inputField;
        }
        return null;
    }

}

const calendar = new Calendar();