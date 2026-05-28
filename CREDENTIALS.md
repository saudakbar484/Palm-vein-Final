# 🔐 MOCK LOGIN CREDENTIALS — Reference

## Test Accounts for Password Login

### Account 1: Regular User
```
Username: alice
Password: password123
Role: User
```

### Account 2: Admin User (FULL ACCESS)
```
Username: admin
Password: admin123
Role: Admin
```

### Account 3: Test User
```
Username: testuser
Password: test123
Role: User
```

### Account 4: John Doe
```
Username: johndoe
Password: user@123
Role: User
```

---

## 📝 Quick Copy-Paste Credentials

| Username | Password | Role |
|:---|:---|:---|
| alice | password123 | User |
| admin | admin123 | Admin |
| testuser | test123 | User |
| johndoe | user@123 | User |

---

## 🚀 How to Login

1. Go to http://localhost:5000
2. Click "Login"
3. Choose "Password" tab
4. Enter any username and password from above
5. Click "Sign In"

---

## ⚠️ Security Note

The passwords are stored as SHA256 hashes in `users.csv` for security:
- Never store plain text passwords in production
- The hashes are one-way encrypted
- Backend compares hashes, never stores or shows passwords

For development/testing only!
