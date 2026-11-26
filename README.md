# Carrer-Hub

Job portal: React (Vite) frontend, Spring Boot backend, MySQL database.

```
Carrer-Hub/
  Frantend/CareerHub     React + Vite + Tailwind
  Backend/careerhub1     Spring Boot 4 (Java 17) + JPA + JWT
  Database/init.sql      creates the carrerhub database (tables are created automatically)
```

## Run on your PC

1. MySQL: run `Database/init.sql` (or let the backend create the database on first start).
2. Backend:
   ```
   cd Backend/careerhub1
   mvn spring-boot:run
   ```
   Runs on http://localhost:8081 with MySQL root/root. Change DB_USERNAME and DB_PASSWORD if yours differ.
3. Frontend:
   ```
   cd Frantend/CareerHub
   npm install
   npm run dev
   ```
   Runs on http://localhost:5173 and sends /api requests to the backend through the Vite proxy.

Default admin: admin@gmail.com / 12345678 (change with ADMIN_GMAIL and ADMIN_PASSWORD).

## Backend environment variables

| Variable | Meaning |
|---|---|
| DB_URL | JDBC url of MySQL, e.g. jdbc:mysql://HOST:3306/carrerhub?useSSL=true&serverTimezone=Asia/Kolkata |
| DB_USERNAME, DB_PASSWORD | database login |
| JWT_SECRET | random string, 32 or more characters |
| ADMIN_GMAIL, ADMIN_PASSWORD | admin account created at startup |
| CORS_ALLOWED_ORIGINS | frontend address, e.g. https://carrer-hub.vercel.app (no slash at the end) |
| FRONTEND_URL | same frontend address, used in emails |
| MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD | optional SMTP, for example smtp.gmail.com with a Gmail app password |
| PORT | set by most hosts automatically |

## Frontend environment variables

| Variable | Meaning |
|---|---|
| VITE_API_URL | backend address, e.g. https://carrerhub-api.onrender.com (no slash at the end) |
| VITE_TURN_URL, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL | optional TURN server for interview video calls on the internet |

## Deploy

1. Database: create a MySQL database (Aiven, Railway, TiDB Cloud or any MySQL host) and note the host, user and password.
2. Backend (Render or Railway): New Web Service from this GitHub repo, Root Directory `Backend/careerhub1`, Runtime Docker. Add the backend variables above. Check `https://YOUR-BACKEND/api/health` returns `{"status":"UP"}`.
3. Frontend (Vercel): Import the repo, Root Directory `Frantend/CareerHub`, Framework Vite, add `VITE_API_URL` with the backend address. Deploy.
4. Go back to the backend and set `CORS_ALLOWED_ORIGINS` and `FRONTEND_URL` to the Vercel address, then redeploy the backend.
