class ElementEditor {

    calendar

    constructor(calendar) {
        this.calendar = calendar;
    }

    createOptionWindow(element, type) {
        const window = document.createElement("div");
        window.classList.add("task-option-window");

        const container = document.createElement("div");
        container.classList.add("task-option-content");

        const elementLocation = element.getBoundingClientRect();

        container.style.left = `${elementLocation.left}px`;
        container.style.top = `${elementLocation.bottom + 5}px`;

        const editButton = document.createElement("button");
        const exitButton = document.createElement("button");


        editButton.textContent = "Edit";
        editButton.addEventListener("click", (e) => {
            e.stopPropagation();

            const editField = this.#handleEdit(element, window, type);
            container.insertBefore(editField, editButton);

            editButton.style.display = "none";
            editField.focus();
        })
        container.append(editButton);

        if (type == "task" || type == "list-element") {
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", async () => {
                const taskId = element.dataset.id;
                if (!taskId) {
                    element.remove();
                    return;
                }
                if (type == "task") {
                    await this.calendar.deleteTask(taskId, element);
                }
                else {
                    console.log("TYPE ÄR LIST ELEMENT, TA BORT");
                }
                window.remove();
            });
            container.append(deleteButton);
        }

        exitButton.textContent = "Exit";
        exitButton.addEventListener("click", () => {
            window.remove();
        });
        container.append(exitButton);

        window.append(container);

        window.addEventListener("click", (e) => {
            if (e.target === window) {
                window.remove();
            }
        });

        return window;
    }

    async #editTask(element, editedText) {
        try {
            const response = await fetch(`/api/tasks/${element.dataset.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title: editedText })
            });

            if (response.ok) {
                element.textContent = editedText;
                return true;
            }
        } catch (err) {
            console.error("Failed to edit", err);
        }
        return false;
    }

    async #editListTitle(element, editedText) {
        console.log("WE UPDATE TITLE OF LIST");
        return false;
    }

    async #editListElement(element, editedText) {
        console.log("WE UPDATE LIST ELEMENT");
        return false;
    }

    #createEditField(elementText) {
        const editField = document.createElement("input");
        editField.classList.add("input-field");
        editField.value = elementText;

        return editField;
    }

    #handleEdit(element, optionWindow, type) {
        const editField = this.#createEditField(element.textContent);

        editField.addEventListener("keydown", async (e) => {
            if (e.key === "Enter") {

                const editedText = editField.value.trim();
                if (!editedText) {
                    console.error("Content cannot be empty.");
                    return;
                }

                switch (type) {
                    case "task": {
                        if(this.#editTask(element, editedText)){
                            optionWindow.remove();
                        }
                        break;
                    }
                    case "list-title": {
                        if(this.#editListTitle(element, editedText)){
                            optionWindow.remove();
                        }
                        break;
                    }
                    case "list-element": {
                        if(this.#editListElement(element, editedText)){
                            optionWindow.remove();
                        }
                        break;
                    }
                }

            } else if (e.key === "Escape") {
                if (optionWindow) optionWindow.remove();
            }
        });

        return editField;
    }

    
}