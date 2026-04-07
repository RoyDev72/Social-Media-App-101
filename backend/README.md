# Social Hub Backend (Admin Panel)

## Setup

1. Open terminal in `backend`
2. Ensure MongoDB is running locally (or provide a MongoDB Atlas URI)
3. Create a `.env` file in `backend/` (you can copy from `.env.example`)
4. Install dependencies:

```bash
npm install
```

5. Start server:

```bash
npm start
```

6. Open admin panel:

- http://localhost:4000/admin

## Default Admin Login

- Username: `admin`
- Password: `Admin@123`

## Notes

- Data is stored in MongoDB.
- Default connection URI: `mongodb://127.0.0.1:27017/social_hub`
- You can override with environment variable `MONGODB_URI`.
- Environment variables are auto-loaded from `backend/.env`.
- This is a local development backend for assignment/demo purposes.
