const API_BASE = 'http://localhost:5000';

const endpoints = [
    {
        category: 'Authentication',
        id: 'auth',
        items: [
            {
                method: 'POST',
                path: '/api/auth/login',
                description: 'Authenticate user and receive JWT token',
                role: 'Public',
                body: { username: 'superadmin', password: 'admin123' },
                response: { success: true, token: 'eyJhbGci...', user: { username: 'superadmin', role: 'superadmin' } }
            },
            {
                method: 'POST',
                path: '/api/auth/register',
                description: 'Register a new user account (auto-login with token). Set temporary=true for 2-hour test users with premium access. Username/email auto-generated if not provided.',
                role: 'Public',
                body: { password: 'secure123', role: 'editor', temporary: true },
                response: { success: true, message: 'Temporary user created with premium access (expires in 2 hours)', token: 'eyJhbGci...', user: { username: 'temp_1234_abc123', role: 'editor', temporary: true } }
            },
            {
                method: 'GET',
                path: '/api/auth/me',
                description: 'Get current authenticated user details',
                role: 'Authenticated',
                response: { success: true, user: { _id: '123', username: 'superadmin', role: 'superadmin' } }
            }
        ]
    },
    {
        category: 'User Management',
        id: 'users',
        items: [
            {
                method: 'GET',
                path: '/api/users',
                description: 'List all users with pagination',
                role: 'Admin',
                response: { success: true, data: [{ _id: '123', username: 'user1', email: 'user1@example.com', role: 'editor' }] }
            },
            {
                method: 'POST',
                path: '/api/users',
                description: 'Create a new user',
                role: 'Admin',
                body: { username: 'neweditor', email: 'editor@example.com', password: 'secure123', role: 'editor' },
                response: { success: true, message: 'User created successfully' }
            },
            {
                method: 'GET',
                path: '/api/users/:id',
                description: 'Get specific user by ID',
                role: 'Admin',
                response: { success: true, data: { _id: '123', username: 'user1', email: 'user1@example.com' } }
            },
            {
                method: 'DELETE',
                path: '/api/users/:id',
                description: 'Deactivate user (soft delete)',
                role: 'Admin',
                response: { success: true, message: 'User deactivated successfully' }
            }
        ]
    },
    {
        category: 'Content Management',
        id: 'content',
        items: [
            {
                method: 'GET',
                path: '/api/content',
                description: 'List all content with pagination',
                role: 'Editor',
                response: { success: true, data: [{ _id: '123', title: 'Article 1', status: 'published' }] }
            },
            {
                method: 'POST',
                path: '/api/content',
                description: 'Create new content',
                role: 'Editor',
                body: { title: 'New Article', content: 'Content here...', status: 'draft', type: 'article' },
                response: { success: true, message: 'Content created successfully', data: { _id: '123', title: 'New Article' } }
            },
            {
                method: 'GET',
                path: '/api/content/:id',
                description: 'Get specific content by ID',
                role: 'Editor',
                response: { success: true, data: { _id: '123', title: 'Article 1', body: 'Content...' } }
            },
            {
                method: 'PUT',
                path: '/api/content/:id',
                description: 'Update content',
                role: 'Editor',
                body: { title: 'Updated Title', content: 'Updated content...' },
                response: { success: true, message: 'Content updated successfully' }
            },
            {
                method: 'DELETE',
                path: '/api/content/:id',
                description: 'Delete content',
                role: 'Editor',
                response: { success: true, message: 'Content deleted successfully' }
            }
        ]
    },
    {
        category: 'Image Management',
        id: 'images',
        items: [
            {
                method: 'POST',
                path: '/api/image-management/upload',
                description: 'Upload images (multipart/form-data)',
                role: 'Editor',
                body: 'Use FormData with "images" field',
                response: { success: true, message: 'Images uploaded successfully', data: { uploaded: 2 } }
            },
            {
                method: 'GET',
                path: '/api/image-management/content-page',
                description: 'Get images for content page',
                role: 'Editor',
                response: { success: true, data: { images: [], files: [] } }
            },
            {
                method: 'POST',
                path: '/api/image-management/make-public',
                description: 'Make images public',
                role: 'Editor',
                body: { imageIds: ['img1', 'img2'] },
                response: { success: true, message: 'Images made public' }
            },
            {
                method: 'DELETE',
                path: '/api/image-management/bulk-delete',
                description: 'Delete multiple images',
                role: 'Editor',
                body: { imageIds: ['img1', 'img2'] },
                response: { success: true, message: 'Images deleted successfully' }
            }
        ]
    },
    {
        category: 'File Management',
        id: 'files',
        items: [
            {
                method: 'GET',
                path: '/api/files',
                description: 'List all files',
                role: 'Editor',
                response: { success: true, data: [{ _id: '123', filename: 'document.pdf', size: 1024 }] }
            },
            {
                method: 'POST',
                path: '/api/files/upload',
                description: 'Upload files (multipart/form-data)',
                role: 'Editor',
                body: 'Use FormData with "file" or "files" field',
                response: { success: true, message: 'File uploaded successfully' }
            },
            {
                method: 'DELETE',
                path: '/api/files/:id',
                description: 'Delete file',
                role: 'Editor',
                response: { success: true, message: 'File deleted successfully' }
            }
        ]
    },
    {
        category: 'Collections',
        id: 'collections',
        items: [
            {
                method: 'GET',
                path: '/api/image-management/collections',
                description: 'List all collections',
                role: 'Editor',
                response: { success: true, data: [{ _id: '123', name: 'My Collection', stats: { totalImages: 10 } }] }
            },
            {
                method: 'POST',
                path: '/api/image-management/collections',
                description: 'Create new collection',
                role: 'Editor',
                body: { name: 'New Collection', description: 'Description here', tags: ['tag1'] },
                response: { success: true, message: 'Collection created successfully' }
            },
            {
                method: 'GET',
                path: '/api/image-management/collections/:id',
                description: 'Get collection details',
                role: 'Editor',
                response: { success: true, data: { collection: {}, images: [] } }
            },
            {
                method: 'GET',
                path: '/api/image-management/collections/:id/download-zip',
                description: 'Download collection as ZIP',
                role: 'Editor',
                response: 'Binary ZIP file'
            },
            {
                method: 'POST',
                path: '/api/image-management/collections/:id/add-images',
                description: 'Add images to collection',
                role: 'Editor',
                body: { imageIds: ['img1', 'img2'] },
                response: { success: true, message: '2 images added to collection' }
            },
            {
                method: 'DELETE',
                path: '/api/image-management/collections/:id',
                description: 'Delete collection',
                role: 'Editor',
                response: { success: true, message: 'Collection deleted successfully' }
            }
        ]
    },
    {
        category: 'Tenant Management',
        id: 'tenants',
        items: [
            {
                method: 'GET',
                path: '/api/tenants',
                description: 'List all tenants',
                role: 'SuperAdmin',
                response: { success: true, data: [{ _id: '123', name: 'Tenant 1', isActive: true }] }
            },
            {
                method: 'POST',
                path: '/api/tenants',
                description: 'Create new tenant with admin',
                role: 'SuperAdmin',
                body: { name: 'New Tenant', domain: 'tenant.example.com', adminUsername: 'admin', adminEmail: 'admin@tenant.com', adminPassword: 'secure123' },
                response: { success: true, message: 'Tenant created successfully' }
            },
            {
                method: 'PUT',
                path: '/api/tenants/:id',
                description: 'Update tenant',
                role: 'SuperAdmin',
                body: { name: 'Updated Name', isActive: true },
                response: { success: true, message: 'Tenant updated successfully' }
            }
        ]
    },
    {
        category: 'Analytics',
        id: 'analytics',
        items: [
            {
                method: 'GET',
                path: '/api/analytics/dashboard',
                description: 'Get dashboard statistics',
                role: 'Admin',
                response: { success: true, data: { totalUsers: 150, totalFiles: 450, totalImages: 1250 } }
            },
            {
                method: 'GET',
                path: '/api/analytics/users',
                description: 'Get user analytics',
                role: 'Admin',
                response: { success: true, data: { activeUsersCount: 120, newUsersCount: 15 } }
            },
            {
                method: 'GET',
                path: '/api/analytics/system',
                description: 'Get system health metrics',
                role: 'Admin',
                response: { success: true, data: { uptime: 86400, memory: { used: 512, total: 2048 } } }
            }
        ]
    },
    {
        category: 'Notifications',
        id: 'notifications',
        items: [
            {
                method: 'GET',
                path: '/api/notifications',
                description: 'List all notifications',
                role: 'Authenticated',
                response: { success: true, notifications: [{ _id: '123', title: 'Welcome', message: 'Hello!', read: false }] }
            },
            {
                method: 'GET',
                path: '/api/notifications/unread',
                description: 'Get unread notifications count',
                role: 'Authenticated',
                response: { success: true, count: 5 }
            },
            {
                method: 'PATCH',
                path: '/api/notifications/:id/read',
                description: 'Mark notification as read',
                role: 'Authenticated',
                response: { success: true, message: 'Notification marked as read' }
            }
        ]
    },
    {
        category: 'Subscriptions',
        id: 'subscriptions',
        items: [
            {
                method: 'GET',
                path: '/api/subscription/status',
                description: 'Get subscription status',
                role: 'Admin',
                response: { success: true, data: { hasActiveSubscription: true, plan: 'premium' } }
            },
            {
                method: 'POST',
                path: '/api/subscription/create-order',
                description: 'Create subscription order',
                role: 'Admin',
                body: { planType: 'monthly', tenantId: '123' },
                response: { success: true, orderId: 'order_123', amount: 999 }
            },
            {
                method: 'DELETE',
                path: '/api/subscription/cancel',
                description: 'Cancel subscription',
                role: 'Admin',
                response: { success: true, message: 'Subscription cancelled successfully' }
            }
        ]
    }
];

function renderEndpoints() {
    const container = document.getElementById('endpoints');
    container.innerHTML = '';
    
    endpoints.forEach(category => {
        const section = document.createElement('section');
        section.className = 'category';
        section.id = category.id;
        
        section.innerHTML = `<h2>${category.category}</h2>`;
        
        category.items.forEach(endpoint => {
            const endpointDiv = document.createElement('div');
            endpointDiv.className = 'endpoint';
            
            const hasBody = endpoint.body && endpoint.method !== 'GET';
            
            endpointDiv.innerHTML = `
                <div class="endpoint-header">
                    <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                    <span class="endpoint-path">${endpoint.path}</span>
                    <span class="role-badge">${endpoint.role}</span>
                </div>
                <p class="endpoint-description">${endpoint.description}</p>
                ${hasBody ? `
                    <div class="code-block">
                        <strong>Request Body:</strong>
                        <pre>${JSON.stringify(endpoint.body, null, 2)}</pre>
                    </div>
                ` : ''}
                <div class="code-block">
                    <strong>Response:</strong>
                    <pre>${typeof endpoint.response === 'string' ? endpoint.response : JSON.stringify(endpoint.response, null, 2)}</pre>
                </div>
                <button class="try-it-btn" onclick='openTryIt(${JSON.stringify(endpoint)})'>🚀 Try It</button>
            `;
            
            section.appendChild(endpointDiv);
        });
        
        container.appendChild(section);
    });
}

function openTryIt(endpoint) {
    const modal = document.getElementById('tryItModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalUrl = document.getElementById('modalUrl');
    const modalToken = document.getElementById('modalToken');
    const modalBody = document.getElementById('modalBody');
    const bodyGroup = document.getElementById('bodyGroup');
    const responseSection = document.getElementById('responseSection');
    
    modalTitle.textContent = `${endpoint.method} ${endpoint.path}`;
    modalUrl.value = API_BASE + endpoint.path;
    modalToken.value = sessionStorage.getItem('jcms_token') || '';
    
    if (endpoint.body && endpoint.method !== 'GET') {
        bodyGroup.style.display = 'block';
        modalBody.value = typeof endpoint.body === 'string' ? endpoint.body : JSON.stringify(endpoint.body, null, 2);
    } else {
        bodyGroup.style.display = 'none';
    }
    
    responseSection.style.display = 'none';
    modal.style.display = 'block';
    
    window.currentEndpoint = endpoint;
}

async function sendRequest() {
    const url = document.getElementById('modalUrl').value;
    const token = document.getElementById('modalToken').value;
    const body = document.getElementById('modalBody').value;
    const method = window.currentEndpoint.method;
    const path = window.currentEndpoint.path;
    
    const responseSection = document.getElementById('responseSection');
    const responseStatus = document.getElementById('responseStatus');
    const responseBody = document.getElementById('responseBody');
    
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (body && method !== 'GET') {
            options.body = body;
        }
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        responseStatus.textContent = `${response.status} ${response.statusText}`;
        responseStatus.className = response.ok ? 'success' : 'error';
        responseBody.textContent = JSON.stringify(data, null, 2);
        responseSection.style.display = 'block';
        
        // Auto-save token from login/register responses
        if (response.ok && data.token && (path === '/api/auth/login' || path === '/api/auth/register')) {
            sessionStorage.setItem('jcms_token', data.token);
            document.getElementById('globalToken').value = data.token;
            
            // Show success notification
            const notification = document.createElement('div');
            notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:15px 20px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);z-index:10000;animation:slideIn 0.3s ease';
            notification.textContent = '✓ Token auto-saved! All requests will now use this token.';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    } catch (error) {
        responseStatus.textContent = 'Error';
        responseStatus.className = 'error';
        responseBody.textContent = error.message;
        responseSection.style.display = 'block';
    }
}

function saveToken() {
    const token = document.getElementById('globalToken').value;
    sessionStorage.setItem('jcms_token', token);
    alert('Token saved for this session! It will be auto-included in all requests.');
}

function copyResponse() {
    const responseBody = document.getElementById('responseBody').textContent;
    navigator.clipboard.writeText(responseBody);
    alert('Response copied to clipboard!');
}

document.getElementById('darkModeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    sessionStorage.setItem('darkMode', document.body.classList.contains('dark'));
});

document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('tryItModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
    const modal = document.getElementById('tryItModal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

document.getElementById('searchInput').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    document.querySelectorAll('.endpoint').forEach(endpoint => {
        const text = endpoint.textContent.toLowerCase();
        endpoint.style.display = text.includes(search) ? 'block' : 'none';
    });
});

if (sessionStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
}

renderEndpoints();
