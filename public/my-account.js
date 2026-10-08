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
const popUpWindowHeader = document.getElementById("popup-window-header");
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

function showInputsFields() {
    const inputs = popUpWindowInputContainer.querySelectorAll("input");
    inputs.forEach((input) => {
        input.value = "";
        input.classList.remove("hidden")
    });
}

function hideInputsFields() {
    const inputs = popUpWindowInputContainer.querySelectorAll("input");
    inputs.forEach(input => input.classList.add("hidden"));
}

function showPopUpWindow(title, description, showInput = false, inputType = "text") {
    unHidePopUpWindow();
    popUpWindowHeader.textContent = title;

    if (showInput) {
        showInputsFields();
        handleIfInput(inputType);
    } else {
        hideInputsFields();
    }
}


function handleIfInput(inputType) {
    if (inputType === "password") {
        popUpWindowInputContainer.querySelector("#popup-window-input-1").setAttribute("type", "password");
        popUpWindowInputContainer.querySelector("#popup-window-input-1").setAttribute("placeholder", "New Password");

        popUpWindowInputContainer.querySelector("#popup-window-input-2").setAttribute("type", "password");
        popUpWindowInputContainer.querySelector("#popup-window-input-2").setAttribute("placeholder", "Current Password");
    } else {
        popUpWindowInputContainer.querySelector("#popup-window-input-1").setAttribute("type", "text");
        popUpWindowInputContainer.querySelector("#popup-window-input-1").setAttribute("placeholder", "First Name");

        popUpWindowInputContainer.querySelector("#popup-window-input-2").setAttribute("type", "text");
        popUpWindowInputContainer.querySelector("#popup-window-input-2").setAttribute("placeholder", "Last Name");
    }
}

// ******************
// BUTTON EVENT LISTENERS
// ******************'

// Cancel
cancelButton.addEventListener("click", () => {
    hidePopUpWindow();
    hideInputsFields();
});

// Change name
changeNameButton.addEventListener("click", () => {
    showPopUpWindow("Change Name", "Enter your new name below:", true);
    submitButton.addEventListener("click", () => {
        requestChangeName();
    }, { once: true });
});

// Delete account
deleteButton.addEventListener("click", () => {
    showPopUpWindow("Delete Account", "Are you sure you want to delete your account? This action cannot be undone.", false);
    submitButton.addEventListener("click", () => {
        requestDeleteAccount();
    }, { once: true });
});

// Change password
changePasswordButton.addEventListener("click", () => {
    showPopUpWindow("Change Password", "Enter your new password below:", true, "password");
    submitButton.addEventListener("click", async () => {
        submitButton.textContent = "Submitting...";
        await requestChangePassword();
        submitButton.textContent = "Submit";
    }, { once: true });
});

// Share requests
shareRequestButton.addEventListener("click", async () => {
    showPopUpWindow("Share Requests", "Here are your share requests:", false);
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
// REQUEST/LOAD FUNCTIONS
// ******************



async function requestChangePassword() {
    const newPassword = popUpWindow.querySelector("#popup-window-input-1").value;
    const currentPassword = popUpWindow.querySelector("#popup-window-input-2").value;

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

async function requestChangeName() {
    const newName = popUpWindow.querySelector("#popup-window-input-1").value;
    const lastName = popUpWindow.querySelector("#popup-window-input-2").value;

    const response = await fetch("/api/change-name", {
        method: "PUT",
        body: JSON.stringify({firstName: newName, lastName: lastName}),
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (response.ok) {
        popUpWindowErrorMessage.textContent = "";
        hidePopUpWindow();

        localStorage.setItem("firstName", newName);
    } else {
        popUpWindowErrorMessage.textContent = "Failed to change name. Please try again.";
    }
}

async function requestDeleteAccount() {
    try {
        const response = await fetch("/api/delete-account", {
            method: "DELETE"
        });

        if (response.ok) {
        popUpWindowErrorMessage.textContent = "";
        hidePopUpWindow();
        logout();
    } else {
        popUpWindowErrorMessage.textContent = "Failed to delete account. Please try again.";
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