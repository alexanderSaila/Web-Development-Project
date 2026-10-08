function logout() {
    fetch('/logout', {
        method: 'POST'
    }).then(() => {
        window.location.href = '/login.html';
    })
};


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
            this.#displayMonth();
        });
        this.nextMonthButton.addEventListener("click", () => {
            this.selectedDate.setMonth(this.selectedDate.getMonth() + 1);
            this.#displayMonth();
        });

        this.#displayMonth();
        this.#loadTasks();
    }

    #displayMonth() {
        const month = this.selectedDate.getMonth() + 1;
        const year = this.selectedDate.getFullYear();

        this.#displayCalendarName(month - 1);
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

                tempDay = this.#createDayNode(dayName, offset, month - 1, true);
            } else {
                const dayNumber = i - startDay + 1;

                tempDay = this.#createDayNode(dayName, dayNumber, month, false);
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
                const tempDay = this.#createDayNode(dayName, i + 1, month + 1, true);
                currentWeekDiv.append(tempDay);
            }
            this.weekContainer.append(currentWeekDiv);
        }
    }

    #displayCalendarName(month) {
        const calendarHeader = document.getElementById("month-name");
        calendarHeader.textContent = Calendar.monthNames[month] + " " + this.selectedDate.getFullYear();;
    }

    #createDayNode(dayName, dayNumber, month, isEmpty) {
        const daySection = document.createElement("section");
        daySection.setAttribute("id", `${this.selectedDate.getFullYear()}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`);


        const dayHeader = document.createElement("p");
        dayHeader.textContent = `${dayName} ${dayNumber}/${month}`;
        daySection.append(dayHeader);

        if (!isEmpty) {
            daySection.classList.add("day-section");
            dayHeader.classList.add("day-header");

            daySection.addEventListener("click", () => {
                this.#changeFocusedDay(daySection);
            });
        }
        else {
            dayHeader.classList.add("day-header", "empty");
            daySection.classList.add("day-section", "empty");
        }

        return daySection;
    }

    async #loadTasks() {
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth() + 1;

        try {
            const result = await fetch(`/api/tasks/${year}/${month}`, {
                method: "GET",
            });

            if (!result.ok) return;

            const tasks = await result.json();
            console.log(tasks);
            for (const task of tasks) {

                const daySection = document.getElementById(task.task_date);
                if (daySection) {
                    const tempTask = this.#createTaskElement(task.title, task.id, task.is_owner, task.name);

                    daySection.append(tempTask);
                }
            }

        } catch (e) {
            console.log("Error loading", e);
        }

    }

    async #saveTask(title, parentElement) {
        const taskDate = this.selectedDay.id;
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth() + 1;

        try {
            const response = await fetch(`/api/tasks/${year}/${month}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ task_date: taskDate, title: title })
            });

            if (response.ok) {
                const savedTask = await response.json();
                const finishedTask = this.#createTaskElement(savedTask.title, savedTask.id, true);
                this.selectedDay.insertBefore(finishedTask, parentElement);
            }
        } catch (e) {
            console.log("Failed to save task: ", e);
        }
    }

    async #deleteTask(id, element) {
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth() + 1;

        try {
            const response = await fetch(`/api/tasks/${year}/${month}/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                element.remove();
                const data = await response.json();
                console.log(data.message);
            }
        } catch (e) {
            console.log("Error deleting taks", e);
        }
    }

    #changeFocusedDay(dayElement) {
        if (this.selectedDay === dayElement) { return; }

        this.#clearFocusedDay();

        this.selectedDay = dayElement;

        this.selectedDay.classList.add("selected-day");

        this.selectedDay.append(this.#createAddButton());
    }

    #clearFocusedDay() {
        if (this.selectedDay === null) {
            return;
        }
        this.selectedDay.classList.remove("selected-day");
        this.selectedDay.querySelector(".add-item-button")?.remove();
        this.selectedDay.querySelector(".input-field")?.remove();
    }

    #createAddButton() {
        const addButton = document.createElement("button");
        addButton.className = "add-item-button";
        addButton.textContent = "+";

        addButton.addEventListener("click", (e) => {
            e.stopPropagation();

            addButton.classList.toggle("hidden");

            const inputField = this.#createInputField(addButton);
            if (inputField !== null) {
                this.selectedDay.insertBefore(inputField, addButton);
                inputField.focus();
            }
        })

        return addButton;
    }

    #createInputField(button) {
        if (this.selectedDay.querySelector(".input-field") == null) {
            const inputField = document.createElement("input");
            inputField.className = "input-field";
            inputField.type = "text";
            inputField.placeholder = "Enter Task";

            const removeFieldRevealButton = () => {
                inputField.remove();
                button.classList.remove("hidden");
            }

            inputField.addEventListener("keydown", async (e) => {
                if (e.key === "Enter") {
                    const title = inputField.value.trim();
                    if (title) {
                        await this.#saveTask(title, inputField);
                    }

                    removeFieldRevealButton();
                }
                else if (e.key === "Escape") {
                    removeFieldRevealButton();
                }
            });

            return inputField;
        }
        return null;
    }

    #createTaskElement(inputText, id = null, is_owner, ownerName = null) {
        const finishedTask = document.createElement("li");
        finishedTask.classList.add("day-task");
        finishedTask.textContent = inputText;
        if (id) finishedTask.dataset.id = id;


        if (!is_owner) {
            finishedTask.classList.add("immutable");
            finishedTask.textContent += ` (${ownerName})`;
        } else {
            finishedTask.classList.add("interractable");
            finishedTask.addEventListener("click", async (e) => {
                e.stopPropagation();

                const editTaskWindow = document.getElementById("edit-task-window");
                const optionWindow = this.#createOptionWindow(finishedTask);

                editTaskWindow.append(optionWindow);

            });
        }

        return finishedTask;
    }

    #createOptionWindow(task) {
        const window = document.createElement("div");
        window.classList.add("task-option-window");

        const content = document.createElement("div");
        content.classList.add("task-option-content");

        const taskLocation = task.getBoundingClientRect();

        content.style.left = `${taskLocation.left}px`;
        content.style.top = `${taskLocation.bottom + 5}px`;

        const editButton = document.createElement("button");
        const deleteButton = document.createElement("button");
        const exitButton = document.createElement("button");


        editButton.textContent = "Edit";
        deleteButton.textContent = "Delete";
        exitButton.textContent = "Exit";

        editButton.addEventListener("click", (e) => {
            e.stopPropagation();

            const editField = this.#createEditTaskField(task, window);
            content.insertBefore(editField, editButton);

            console.log("ADDED EDIT FIELD");

            editButton.style.display = "none";
            editField.focus();
        })

        deleteButton.addEventListener("click", async () => {
            const taskId = task.dataset.id;
            if (!taskId) {
                task.remove();
                return;
            }
            await this.#deleteTask(taskId, task);
            window.remove();
        });

        exitButton.addEventListener("click", () => {
            window.remove();
        });

        window.addEventListener("click", (e) => {
            if (e.target === window) {
                window.remove();
            }
        });

        content.append(editButton);
        content.append(deleteButton);
        content.append(exitButton);
        window.append(content);

        return window;
    }

    #createEditTaskField(task, optionWindow) {
        const editField = document.createElement("input");
        editField.classList.add("input-field");
        editField.value = task.textContent;

        editField.addEventListener("keydown", async (e) => {
            if (e.key === "Enter") {
                //const userId = sessionStorage.getItem("loggedInUserId");
                const editedText = editField.value.trim();
                try {
                    const response = await fetch(`/api/tasks/${task.dataset.id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            //"user-id": userId
                        },
                        body: JSON.stringify({ title: editedText })
                    });

                    if (response.ok) {
                        task.textContent = editedText;
                        if (optionWindow) optionWindow.remove();
                    }
                } catch (err) {
                    console.error("Failed to edit task:", err);
                }
            } else if (e.key === "Escape") {
                if (optionWindow) optionWindow.remove();
            }
        });

        return editField;
    }
}

new Calendar();