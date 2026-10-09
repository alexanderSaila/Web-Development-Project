const changeNameButton = document.getElementById("change-name-button");
const changePasswordButton = document.getElementById("change-password-button");
const backButton = document.getElementById("back-button");
const shareRequestButton = document.getElementById("share-requests-button");
const deleteButton = document.getElementById("delete-button");
deleteButton.classList.add("delete");

const submitButton = document.getElementById("submit-button");
const cancelButton = document.getElementById("cancel-button");

const popUpWindow = document.getElementById("popup-window");
popUpWindow.classList.add("hidden");
const backdrop = document.getElementById("backdrop");
backdrop.classList.add("hidden");
const popUpWindowInputContainer = document.getElementById("popup-window-input-container");
const popUpWindowButtonContainer = document.getElementById("popup-window-button-container");
const popupWindowErrorMessage = document.getElementById("popup-window-error-message");

const requestList = document.getElementById("request-list");

var POPUP_WINDOW_VISIBLE = false;

document.addEventListener("keydown", handleKeyDown);

function logout() {
    fetch('/logout', {
        method: 'POST'
    }).then(() => {
        window.location.href = '/login.html';
    })
};

function hidePopUpWindow() {
    backdrop.classList.add("hidden");
    popUpWindow.classList.add("hidden");
}

function unHidePopUpWindow() {
    backdrop.classList.remove("hidden");
    popUpWindow.classList.remove("hidden");
    POPUP_WINDOW_VISIBLE = true;
}

function handleKeyDown(event) {
    if (event.key === "Escape") {
        if (POPUP_WINDOW_VISIBLE) {
            hidePopUpWindow();
            POPUP_WINDOW_VISIBLE = false;
        }
    }
}

function showPopUpWindow(title, description, action) {
    unHidePopUpWindow();

    const popUpWindowHeader = document.getElementById("popup-window-header");
    popUpWindowHeader.textContent = title;

    const popUpWindowDescription = document.getElementById("popup-window-description");
    popUpWindowDescription.textContent = description;

    switch (action) {
        case "change-name":
            handleChangeNamePopUp();
            break;
        case "change-password":
            handleChangePasswordPopUp();
            break;
        case "delete-account":
            handleDeleteAccountPopUp();
            break;
        case "share-requests":
            handleShareRequestsPopUp();
            break;
        default:
            break;
    }
}

// ******************
// POP UP WINDOWS
// ******************

function handleChangeNamePopUp() {
    const enterFirstName = document.createElement("input");
    enterFirstName.setAttribute("type", "text");
    enterFirstName.setAttribute("placeholder", "First Name");
    const enterLastName = document.createElement("input");
    enterLastName.setAttribute("type", "text");
    enterLastName.setAttribute("placeholder", "Last Name");

    const cancelButton = standardCancelButton();

    const submitButton = standardSubmitButton();

    submitButton.addEventListener("click", async () => {
        const firstName = enterFirstName.value.trim();
        const lastName = enterLastName.value.trim();
        await requestChangeName(firstName, lastName);
    });

    clearInputContainers();

    popUpWindowInputContainer.appendChild(enterFirstName);
    popUpWindowInputContainer.appendChild(enterLastName);

    popUpWindowButtonContainer.appendChild(submitButton);
    popUpWindowButtonContainer.appendChild(cancelButton);
}

function handleChangePasswordPopUp() {
    const enterNewPassword = document.createElement("input");
    enterNewPassword.setAttribute("type", "password");
    enterNewPassword.setAttribute("placeholder", "New Password");
    const enterCurrentPassword = document.createElement("input");
    enterCurrentPassword.setAttribute("type", "password");
    enterCurrentPassword.setAttribute("placeholder", "Current Password");

    const cancelButton = standardCancelButton();

    const submitButton = standardSubmitButton();

    submitButton.addEventListener("click", async () => {
        const newPassword = enterNewPassword.value.trim();
        const currentPassword = enterCurrentPassword.value.trim();
        await requestChangePassword(newPassword, currentPassword);
    });

    clearInputContainers();

    popUpWindowInputContainer.appendChild(enterNewPassword);
    popUpWindowInputContainer.appendChild(enterCurrentPassword);

    popUpWindowButtonContainer.appendChild(submitButton);
    popUpWindowButtonContainer.appendChild(cancelButton);
}

function handleDeleteAccountPopUp() {
    const cancelButton = standardCancelButton();

    const submitButton = standardSubmitButton();
    submitButton.textContent = "Delete Account";

    submitButton.addEventListener("click", async () => {
        await requestDeleteAccount();
        logout();
    });

    clearInputContainers();

    popUpWindowButtonContainer.appendChild(submitButton);
    popUpWindowButtonContainer.appendChild(cancelButton);
}

async function handleShareRequestsPopUp() {
    clearInputContainers();
    const cancelButton = standardCancelButton();
    popUpWindowButtonContainer.appendChild(cancelButton);
    const shares = await loadShareRequests();
    shares.forEach((share) => {
        const listItem = document.createElement("li");
        console.log(share.fName, share.lName, share.type)

        listItem.innerHTML = `
            <p>${share.fName} ${share.lName} has sent you a share request for their ${share.type}.</p>
            <button class="accept-button">Accept</button>
            <button class="decline-button">Decline</button>
        `;
        requestList.appendChild(listItem);

        const acceptButton = listItem.querySelector(".accept-button");
        acceptButton.addEventListener("click", async () => {
            await acceptShareRequest(share.sharerId, share.type);
            listItem.remove();
        });

        const declineButton = listItem.querySelector(".decline-button");
        declineButton.addEventListener("click", async () => {
            await declineShareRequest(share.sharerId, share.type);
            listItem.remove();
        });

    });
}

// ******************
// BUTTON EVENT LISTENERS
// ******************

// Change name
changeNameButton.addEventListener("click", () => {
    showPopUpWindow("Change Name", "Enter your new name below:", "change-name");
});

// Change password
changePasswordButton.addEventListener("click", () => {
    showPopUpWindow("Change Password", "Enter your new password below:", "change-password");
});

// Delete account
deleteButton.addEventListener("click", () => {
    showPopUpWindow("Delete Account", "Are you sure you want to delete your account? This action cannot be undone.", "delete-account");
});

// Share requests
shareRequestButton.addEventListener("click", async () => {
    showPopUpWindow("Share Requests", "Here are your share requests:", "share-requests");

});

async function acceptShareRequest(sharerId, type) {
    const endPoint = type === "list" ? "/api/lists/share/accept" : "/api/tasks/share/accept";
    const response = await fetch(endPoint, {
        method: "POST",
        body: JSON.stringify({ sharerId }),
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (response.ok) {
        popupWindowErrorMessage.textContent = "";
    } else {
        popupWindowErrorMessage.textContent = "Failed to accept share request. Please try again.";
    }
}

async function declineShareRequest(sharerId, type) {
    popupWindowErrorMessage.textContent = "Decline share request functionality is not implemented yet.";
}

// Back
backButton.addEventListener("click", () => {
    window.location.href = "Calendar.html";
});

// ******************
// HELPER FUNCTIONS
// ******************

function standardCancelButton() {
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.classList.add("popup-window-cancel-button");

    cancelButton.addEventListener("click", () => {
        hidePopUpWindow();
    });

    return cancelButton;
}

function standardSubmitButton() {
    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    submitButton.classList.add("interract-button");

    return submitButton;
}

function clearInputContainers() {
    popUpWindowInputContainer.innerHTML = "";
    popUpWindowButtonContainer.innerHTML = "";
}

// ******************
// REQUEST/LOAD FUNCTIONS
// ******************

async function requestChangePassword(newPassword, currentPassword) {

    const response = await fetch("/api/change-password", {
        method: "PUT",
        body: JSON.stringify({
            newPassword: newPassword,
            currentPassword: currentPassword
        }),
        headers: {
            "Content-Type": "application/json"
        }
    })

    const data = await response.json();

    if (response.ok) {
        hidePopUpWindow();
        popupWindowErrorMessage.textContent = "";
    } else {
        popupWindowErrorMessage.textContent = "Failed to change password. Please try again.";
    }
}

async function requestChangeName(firstName, lastName) {

    if (!firstName || !lastName) {
        popupWindowErrorMessage.textContent = "Please enter both first and last name.";
        return;
    }

    const response = await fetch("/api/change-name", {
        method: "PUT",
        body: JSON.stringify({ firstName: newName, lastName: lastName }),
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (response.ok) {
        popupWindowErrorMessage.textContent = "";
        hidePopUpWindow();

        localStorage.setItem("firstName", newName);
    } else {
        popupWindowErrorMessage.textContent = "Failed to change name. Please try again.";
    }
}

async function requestDeleteAccount() {
    try {
        const response = await fetch("/api/delete-account", {
            method: "DELETE"
        });

        if (response.ok) {
            popupWindowErrorMessage.textContent = "";
            hidePopUpWindow();
            logout();
        } else {
            popupWindowErrorMessage.textContent = "Failed to delete account. Please try again.";
        }
    } catch (error) {
        console.error("Error deleting account:", error);
    }
}

async function loadShareRequests() {
    try {
        const response = await fetch("/api/share/pending");

        if (!response.ok) {
            popupWindowErrorMessage.textContent = "Failed to fetch share requests.";
            throw new Error("Failed to fetch share requests.");
        }

        const shareRequests = await response.json();
        console.log("Share Requests:", shareRequests);
        return shareRequests;

    } catch (error) {
        console.error("Error loading share requests:", error);
    }
}