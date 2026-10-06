async function loadUsers() {
    try {
        const response = await fetch('/admin/users');
        // Cookies skickas automatiskt, inget behöver göras!

        if (!response.ok) {
            throw new Error('Failed to load users');
        }

        const users = await response.json();
        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.uID}</td>
                <td>${user.fName}</td>
                <td>${user.lName}</td>
                <td>${user.email}</td>
                <td>${user.is_admin ? 'Yes' : 'No'}</td>
                <td>
                    <button class="delete-btn" onclick="deleteUser(${user.uID})">Delete</button>
                    <button class="edit-btn" onclick="toggleAdmin(${user.uID}, ${user.is_admin})">Toggle Admin</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) {
        console.error(e);
        alert("Error loading users");
    }
}

window.addEventListener('load', loadUsers);

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        fetch(`/admin/users/${userId}`, {
            method: 'DELETE'
            // Cookies skickas automatiskt!
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete user');
            }
            loadUsers();
        })
        .catch(error => {
            console.error(error);
            alert("Error deleting user");
        });
    }
}

function toggleAdmin(userId, isAdmin) {
    const newAdminStatus = !isAdmin;
    fetch(`/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
            // Cookies skickas automatiskt, user-id-headern är inte nödvändig!
        },
        body: JSON.stringify({ is_admin: newAdminStatus })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to toggle admin status');
        }
        loadUsers();
    })
    .catch(error => {
        console.error(error);
        alert("Error toggling admin status");
    });
}

function logout() {
    fetch('/logout', {
        method: 'POST'
    }).then(() => {
        window.location.href = '/login.html';
    })
};