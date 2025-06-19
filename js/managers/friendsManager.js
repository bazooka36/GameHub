/**
 * Friends Manager - Handles friends functionality
 */

export class FriendsManager {
    constructor() {
        this.friends = [];
        this.friendRequests = [];
        this.userManager = null; // Will be injected by main app
    }

    /**
     * Set user manager reference
     * @param {UserManager} userManager - User manager instance
     */
    setUserManager(userManager) {
        this.userManager = userManager;
    }

    async init() {
        console.log('FriendsManager initialized');
        this.loadFriends();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Friends modal events
        const friendsModal = document.getElementById('friends-modal');
        if (friendsModal) {
            const closeBtn = friendsModal.querySelector('.friends-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideFriendsModal());
            }
            
            // Close modal when clicking outside
            friendsModal.addEventListener('click', (e) => {
                if (e.target === friendsModal) {
                    this.hideFriendsModal();
                }
            });
        }

        // Add friend button
        const addFriendBtn = document.getElementById('add-friend-button');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => this.showAddFriendModal());
        }

        // Add friend modal events
        const addFriendModal = document.getElementById('add-friend-modal');
        if (addFriendModal) {
            const closeBtn = addFriendModal.querySelector('.friends-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideAddFriendModal());
            }
            
            // Close modal when clicking outside
            addFriendModal.addEventListener('click', (e) => {
                if (e.target === addFriendModal) {
                    this.hideAddFriendModal();
                }
            });
        }

        // Search friend button
        const searchFriendBtn = document.getElementById('search-friend-button');
        if (searchFriendBtn) {
            searchFriendBtn.addEventListener('click', () => this.searchFriend());
        }
    }

    showFriendsModal() {
        const modal = document.getElementById('friends-modal');
        if (modal) {
            modal.classList.add('active');
            this.renderFriendsList();
            this.renderFriendRequests();
        }
    }

    hideFriendsModal() {
        const modal = document.getElementById('friends-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showAddFriendModal() {
        const modal = document.getElementById('add-friend-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideAddFriendModal() {
        const modal = document.getElementById('add-friend-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async searchFriend() {
        const friendIdInput = document.getElementById('friend-id-input');
        const searchResultContainer = document.getElementById('search-result-container');
        
        if (!friendIdInput || !searchResultContainer) return;

        const friendId = friendIdInput.value.trim();
        
        if (!friendId) {
            this.showSearchResult('Введите ID пользователя', 'error');
            return;
        }

        try {
            // Simulate API call
            const user = await this.findUserById(friendId);
            
            if (user) {
                this.showSearchResult(user, 'success');
            } else {
                this.showSearchResult('Пользователь не найден', 'error');
            }
        } catch (error) {
            console.error('Error searching friend:', error);
            this.showSearchResult('Ошибка поиска', 'error');
        }
    }

    async findUserById(id) {
        // Get real users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        
        // Find user by ID
        const user = users.find(u => u.id == id); // Use == for type coercion
        
        if (!user) {
            return null;
        }
        
        // Don't allow adding yourself as friend
        if (currentUser && user.id === currentUser.id) {
            return { error: 'Вы не можете добавить себя в друзья' };
        }
        
        // Check if already friends
        const friends = JSON.parse(localStorage.getItem(`friends_${currentUser?.id}`) || '[]');
        const isAlreadyFriend = friends.some(friend => friend.id === user.id);
        
        if (isAlreadyFriend) {
            return { error: 'Этот пользователь уже у вас в друзьях' };
        }
        
        // Check if friend request already sent
        const friendRequests = JSON.parse(localStorage.getItem(`friend_requests_${user.id}`) || '[]');
        const requestAlreadySent = friendRequests.some(request => request.fromId === currentUser?.id);
        
        if (requestAlreadySent) {
            return { error: 'Запрос в друзья уже отправлен' };
        }
        
        return {
            id: user.id,
            username: user.username || user.email.split('@')[0],
            avatar: user.avatar || 'https://via.placeholder.com/50',
            email: user.email
        };
    }

    showSearchResult(result, type) {
        const container = document.getElementById('search-result-container');
        if (!container) return;

        if (type === 'error' || result.error) {
            const errorMessage = result.error || result;
            container.innerHTML = `
                <div class="text-red-400 text-center py-4 bg-red-900/20 rounded-lg border border-red-500/30">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    ${errorMessage}
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="friend-item bg-gray-800 rounded-lg p-4 mt-4 border border-gray-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <img src="${result.avatar}" alt="Avatar" class="w-12 h-12 rounded-full mr-4 border-2 border-blue-500">
                            <div>
                                <div class="text-white font-medium text-lg">${result.username}</div>
                                <div class="text-gray-400 text-sm">ID: ${result.id}</div>
                                <div class="text-gray-500 text-xs">${result.email}</div>
                            </div>
                        </div>
                        <button class="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg" 
                                onclick="window.friendsManager.sendFriendRequest('${result.id}')">
                            <i class="fas fa-user-plus mr-2"></i>
                            Добавить в друзья
                        </button>
                    </div>
                </div>
            `;
        }
    }

    async sendFriendRequest(friendId) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) {
                console.error('User not logged in');
                return;
            }

            // Get the friend user data
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const friendUser = users.find(u => u.id == friendId);
            
            if (!friendUser) {
                console.error('Friend user not found');
                return;
            }

            // Create friend request
            const friendRequest = {
                id: Date.now(),
                fromId: currentUser.id,
                fromUsername: currentUser.username || currentUser.email.split('@')[0],
                fromAvatar: currentUser.avatar || 'https://via.placeholder.com/50',
                toId: friendUser.id,
                timestamp: new Date().toISOString()
            };

            // Save friend request to localStorage
            const existingRequests = JSON.parse(localStorage.getItem(`friend_requests_${friendUser.id}`) || '[]');
            existingRequests.push(friendRequest);
            localStorage.setItem(`friend_requests_${friendUser.id}`, JSON.stringify(existingRequests));

            // Add to local friend requests list for current user
            this.friendRequests.push({
                id: friendRequest.id,
                friendId: friendUser.id,
                username: friendUser.username || friendUser.email.split('@')[0],
                avatar: friendUser.avatar || 'https://via.placeholder.com/50',
                timestamp: friendRequest.timestamp
            });

            console.log('Friend request sent to:', friendUser.username);

            // Show success message
            const container = document.getElementById('search-result-container');
            if (container) {
                container.innerHTML = `
                    <div class="text-green-400 text-center py-4 bg-green-900/20 rounded-lg border border-green-500/30">
                        <i class="fas fa-check-circle mr-2"></i>
                        Запрос в друзья отправлен пользователю ${friendUser.username || friendUser.email.split('@')[0]}
                    </div>
                `;
            }

            // Close modal after delay
            setTimeout(() => {
                this.hideAddFriendModal();
                this.showFriendsModal();
                this.renderFriendRequests();
            }, 2000);
            
        } catch (error) {
            console.error('Error sending friend request:', error);
            const container = document.getElementById('search-result-container');
            if (container) {
                container.innerHTML = `
                    <div class="text-red-400 text-center py-4 bg-red-900/20 rounded-lg border border-red-500/30">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Ошибка отправки запроса в друзья
                    </div>
                `;
            }
        }
    }

    renderFriendsList() {
        const friendsList = document.getElementById('friends-list');
        if (!friendsList) return;

        // Load friends from localStorage
        this.loadFriends();

        if (this.friends.length === 0) {
            friendsList.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-users text-4xl mb-4"></i>
                    <p class="text-lg font-medium">У вас пока нет друзей</p>
                    <p class="text-sm">Добавьте друзей, чтобы начать общение</p>
                </div>
            `;
        } else {
            friendsList.innerHTML = this.friends.map(friend => `
                <div class="friend-item bg-gray-800 rounded-lg p-4 mb-3 border border-gray-700 hover:border-blue-500 transition-all duration-300">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <img src="${friend.avatar}" alt="Avatar" class="w-12 h-12 rounded-full mr-4 border-2 border-green-500">
                            <div>
                                <div class="text-white font-medium text-lg">${friend.username}</div>
                                <div class="text-green-400 text-sm flex items-center">
                                    <i class="fas fa-circle text-xs mr-2"></i>В сети
                                </div>
                                <div class="text-gray-500 text-xs">${friend.email}</div>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
                                <i class="fas fa-comment mr-2"></i>Написать
                            </button>
                            <button class="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg" 
                                    onclick="window.friendsManager.removeFriend('${friend.id}')">
                                <i class="fas fa-user-times mr-2"></i>Удалить
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    renderFriendRequests() {
        const requestsSection = document.getElementById('friend-requests-section');
        const requestsList = document.getElementById('friend-requests-list');
        
        if (!requestsSection || !requestsList) return;

        // Load friend requests from localStorage
        this.loadFriends();

        if (this.friendRequests.length === 0) {
            requestsSection.classList.add('hidden');
        } else {
            requestsSection.classList.remove('hidden');
            requestsList.innerHTML = this.friendRequests.map(request => `
                <div class="friend-request-item bg-gray-800 rounded-lg p-4 mb-3 border border-gray-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <img src="${request.avatar}" alt="Avatar" class="w-12 h-12 rounded-full mr-4 border-2 border-blue-500">
                            <div>
                                <div class="text-white font-medium text-lg">${request.username}</div>
                                <div class="text-gray-400 text-sm">ID: ${request.friendId}</div>
                                <div class="text-gray-500 text-xs">${new Date(request.timestamp).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg" 
                                    onclick="window.friendsManager.acceptFriendRequest(${request.id})">
                                <i class="fas fa-check mr-2"></i>Принять
                            </button>
                            <button class="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg" 
                                    onclick="window.friendsManager.rejectFriendRequest(${request.id})">
                                <i class="fas fa-times mr-2"></i>Отклонить
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    async acceptFriendRequest(requestId) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) {
                console.error('User not logged in');
                return;
            }

            const request = this.friendRequests.find(r => r.id === requestId);
            if (!request) {
                console.error('Friend request not found');
                return;
            }

            // Get user data for the friend
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const friendUser = users.find(u => u.id == request.friendId);
            
            if (!friendUser) {
                console.error('Friend user not found');
                return;
            }

            // Add to current user's friends list
            const currentUserFriends = JSON.parse(localStorage.getItem(`friends_${currentUser.id}`) || '[]');
            const newFriend = {
                id: friendUser.id,
                username: friendUser.username || friendUser.email.split('@')[0],
                avatar: friendUser.avatar || 'https://via.placeholder.com/50',
                email: friendUser.email,
                addedAt: new Date().toISOString()
            };
            
            currentUserFriends.push(newFriend);
            localStorage.setItem(`friends_${currentUser.id}`, JSON.stringify(currentUserFriends));

            // Add current user to friend's friends list
            const friendUserFriends = JSON.parse(localStorage.getItem(`friends_${friendUser.id}`) || '[]');
            const currentUserAsFriend = {
                id: currentUser.id,
                username: currentUser.username || currentUser.email.split('@')[0],
                avatar: currentUser.avatar || 'https://via.placeholder.com/50',
                email: currentUser.email,
                addedAt: new Date().toISOString()
            };
            
            friendUserFriends.push(currentUserAsFriend);
            localStorage.setItem(`friends_${friendUser.id}`, JSON.stringify(friendUserFriends));

            // Remove friend request from localStorage
            const friendRequests = JSON.parse(localStorage.getItem(`friend_requests_${currentUser.id}`) || '[]');
            const updatedRequests = friendRequests.filter(r => r.id !== requestId);
            localStorage.setItem(`friend_requests_${currentUser.id}`, JSON.stringify(updatedRequests));

            // Update local state
            this.friends.push(newFriend);
            this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);

            // Re-render
            this.renderFriendsList();
            this.renderFriendRequests();

            console.log('Friend request accepted:', friendUser.username);
            
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    }

    async rejectFriendRequest(requestId) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) {
                console.error('User not logged in');
                return;
            }

            // Remove friend request from localStorage
            const friendRequests = JSON.parse(localStorage.getItem(`friend_requests_${currentUser.id}`) || '[]');
            const updatedRequests = friendRequests.filter(r => r.id !== requestId);
            localStorage.setItem(`friend_requests_${currentUser.id}`, JSON.stringify(updatedRequests));

            // Update local state
            this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
            this.renderFriendRequests();

            console.log('Friend request rejected');
            
        } catch (error) {
            console.error('Error rejecting friend request:', error);
        }
    }

    async removeFriend(friendId) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) {
                console.error('User not logged in');
                return;
            }

            // Remove from current user's friends list
            const currentUserFriends = JSON.parse(localStorage.getItem(`friends_${currentUser.id}`) || '[]');
            const updatedFriends = currentUserFriends.filter(friend => friend.id !== friendId);
            localStorage.setItem(`friends_${currentUser.id}`, JSON.stringify(updatedFriends));

            // Remove current user from friend's friends list
            const friendUserFriends = JSON.parse(localStorage.getItem(`friends_${friendId}`) || '[]');
            const updatedFriendFriends = friendUserFriends.filter(friend => friend.id !== currentUser.id);
            localStorage.setItem(`friends_${friendId}`, JSON.stringify(updatedFriendFriends));

            // Update local state
            this.friends = this.friends.filter(friend => friend.id !== friendId);

            // Re-render
            this.renderFriendsList();

            console.log('Friend removed:', friendId);
            
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    }

    loadFriends() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser) return;

        // Load friends from localStorage for current user
        const friendsData = localStorage.getItem(`friends_${currentUser.id}`);
        if (friendsData) {
            this.friends = JSON.parse(friendsData);
        }

        // Load friend requests from localStorage for current user
        const requestsData = localStorage.getItem(`friend_requests_${currentUser.id}`);
        if (requestsData) {
            this.friendRequests = JSON.parse(requestsData);
        }
    }

    saveFriends() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser) return;

        localStorage.setItem(`friends_${currentUser.id}`, JSON.stringify(this.friends));
        localStorage.setItem(`friend_requests_${currentUser.id}`, JSON.stringify(this.friendRequests));
    }
} 