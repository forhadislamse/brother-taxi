
# Ride Sharing App (Brother_taxi Backend)

A backend system for a ride-sharing app connecting riders and drivers in real-time. Features include ride booking, fare calculation, driver tracking, in-app notifications, and local payment integration.

Technologies Used: **Node.js, Express.js, TypeScript, Prisma,  MongoDB, JWT, Vps Hosting(Hostinger, DigitalOcean) WebSocket (real-time), Firebase (notifications), Local payment gateways**.

**Base URL**

**Local:**  
http://localhost:5006/

**Live:**  
https://brother-taxi.vercel.app/

**Postman Documentation:**  
https://documenter.getpostman.com/view/34968572/2sB3HnJemK

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Features](#features)
- [Technology Used](#technology-used)
- [Folder Structure](#folder-structure)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Licenses](#licenses)


## Requirements

Before starting the project, ensure that the following dependencies are installed on your system:

- **Node.js** (v16+)
- **MongoDB** (Running locally or a cloud-based instance such as MongoDB Atlas)
- **NPM or Yarn** for package management
- **Environment variables setup**


**1. Clone the repository:**

```
   git clone https://github.com/forhadislamse/brother-taxi.git
   cd brother-taxi

   // Using npm:
   npm install

   // Or, using yarn:
   yarn install
```

2. Create a `.env` file in the root of the project directory to store environment variables. Example .env file:

```
   
# Server
PORT=your port number
NODE_ENV=development

# Database
DATABASE_URL=mongodb+srv://<your-db-uri>

# Security
BCRYPT_SALT_ROUNDS=<your-salt-rounds>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=<your-jwt-expiration>
REFRESH_TOKEN_SECRET=<your-refresh-token-secret>
REFRESH_TOKEN_EXPIRES_IN=<your-refresh-token-expiration>

# Password Reset
RESET_PASS_TOKEN=<your-reset-token-secret>
RESET_PASS_TOKEN_EXPIRES_IN=5m
RESET_PASS_LINK=http://localhost:3001/reset-password

# Email (SendGrid)
EMAIL=<your-email>
APP_PASS=<your-app-password>

# Stripe (Payments)
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_ADMIN_ACCOUNT_ID=<your-stripe-admin-account-id>
STRIPE_WEBHOOK_KEY=<your-stripe-webhook-key>
FRONTEND_BASE_URL=<your-frontend-url>
CLIENT_URL=<your-client-url>

# Digital Ocean
DO_SPACE_ENDPOINT=<your-do-endpoint>
DO_SPACE_ORIGIN_ENDPOINT=<your-do-origin-endpoint>
DO_SPACE_ACCESS_KEY=<your-do-access-key>
DO_SPACE_SECRET_KEY=<your-do-secret-key>
DO_SPACE_BUCKET=<your-do-bucket-name>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>

# Firebase (Notifications)
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_PRIVATE_KEY_ID=<your-firebase-private-key-id>
FIREBASE_CLIENT_EMAIL=<your-firebase-client-email>
FIREBASE_PRIVATE_KEY=<your-firebase-private-key>
CLIENT_EMAIL=<your-firebase-client-email>
CLIENT_ID=<your-firebase-client-id>
AUTH_URI=https://accounts.google.com/o/oauth2/auth
TOKEN_URI=https://oauth2.googleapis.com/token
AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
CLIENT_X509_CERT_URL=<your-firebase-cert-url>

# Twilio (SMS)
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-phone-number>

```

## Running the Application

We can run the application using the following npm scripts:

### **1. Start the application in development mode:**

For development, we use the dev script, which runs the application using ts-node-dev, so it will automatically reload on file changes:

`npm run dev`

### **2. Start the application:**

After building the application, we can start it with the following command:

`npm run start`

### **3. Build the application:**

This command compiles the TypeScript files into JavaScript files:

`npm run build`


## Features

### Rider Features
- **Book a Ride:** Request a ride instantly.
- **Chat with Driver:** In-app messaging to communicate with the driver.
- **Track Ride:** Real-time location tracking of the assigned driver.
- **Fare Estimation:** View estimated fare before booking.
- **Ride History:** View past rides and trips.
- **Rate & Review Drivers:** Provide feedback after a ride.

### Driver Features
- **View Ride Requests:** See who is booking and accept/reject rides.
- **Track Earnings:** Monitor earnings and completed rides.
- **Ride Status Updates:** Update ride progress (accepted, on the way, completed).
- **Chat with Riders:** Communicate with riders in real-time.
- **Rate & Review Riders:** Provide feedback for each ride.

### Admin Features
- **Manage Users:** View, edit, or remove riders and drivers.
- **Access All Data:** Full access to rides, payments, reviews, and reports.

### Common / System Features
- **Secure Authentication:** JWT-based login for riders, drivers, and admin.
- **Real-time Notifications:** Firebase-powered notifications for ride status updates.
- **Payment Integration:** Local payment gateways and Stripe support.
- **Chat System:** Real-time chat between riders and drivers via WebSocket.

## Technologies Used

- **[Express](https://expressjs.com/)** – Fast, unopinionated, minimalist web framework for Node.js.
- **[TypeScript](https://www.typescriptlang.org/)** – Strongly typed programming language built on JavaScript.
- **[MongoDB](https://www.mongodb.com/)** – Flexible, scalable, high-performance NoSQL database with a document-oriented model.
- **[Zod](https://github.com/colinhacks/zod)** – TypeScript-first schema declaration and validation library.
- **[Prisma](https://www.prisma.io/)** – Next-generation ORM for Node.js and TypeScript.
- **[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)** – Real-time, full-duplex communication between server and clients.
- **[Firebase](https://firebase.google.com/)** – Push notifications and backend services.


```
app.js
server.js
│
└── app
├── db
│ ├── db.interface.js
│ └── db.js
│
├── middlewares
│ ├── auth.js
│ ├── checkBlock.js
│ ├── globalErrorHandler.js
│ └── validateRequest.js
│
├── modules
│ ├── admin
│ │ ├── admin.constant.js
│ │ ├── admin.controller.js
│ │ ├── admin.routes.js
│ │ ├── admin.service.js
│ │ └── admin.validation.js
│ │
│ ├── Auth
│ │ ├── auth.controller.js
│ │ ├── auth.routes.js
│ │ ├── auth.service.js
│ │ └── auth.validation.js
│ │
│ ├── carTransport
│ │ ├── carTransport.controller.js
│ │ ├── carTransport.interface.js
│ │ ├── carTransport.routes.js
│ │ ├── carTransport.service.js
│ │ └── carTransport.validation.js
│ │
│ ├── Chat
│ │ ├── chat.controller.js
│ │ ├── chat.interface.js
│ │ ├── chat.routes.js
│ │ ├── chat.service.js
│ │ └── chat.validation.js
│ │
│ ├── chatImages
│ │ ├── chatImages.controller.js
│ │ └── chatImages.routes.js
│ │
│ ├── estimateFare
│ │ ├── estimateFare.controller.js
│ │ ├── estimateFare.routes.js
│ │ ├── estimateFare.service.js
│ │ └── estimateFare.validation.js
│ │
│ ├── fare
│ │ ├── fare.controller.js
│ │ ├── fare.routes.js
│ │ ├── fare.service.js
│ │ └── fare.validation.js
│ │
│ ├── Notification
│ │ ├── firebaseAdmin.js
│ │ ├── firebaseService.js
│ │ ├── Notification.controller.js
│ │ ├── Notification.routes.js
│ │ ├── Notification.service.js
│ │ └── Notification.validation.js
│ │
│ ├── Payment
│ │ ├── Payment.controller.js
│ │ ├── Payment.interface.js
│ │ ├── Payment.routes.js
│ │ ├── Payment.service.js
│ │ └── Payment.webhook.js
│ │
│ ├── Review
│ │ ├── review.controller.js
│ │ ├── review.interface.js
│ │ ├── review.route.js
│ │ └── review.service.js
│ │
│ ├── User
│ │ ├── user.controller.js
│ │ ├── user.costant.js
│ │ ├── user.interface.js
│ │ ├── user.route.js
│ │ ├── user.services.js
│ │ └── user.validation.js
│ │
│ └── vehicle
│ ├── vehicle.constant.js
│ ├── vehicle.controller.js
│ ├── vehicle.interface.js
│ ├── vehicle.routes.js
│ └── vehicle.service.js
│
├── routes
│ └── index.js
│
├── chats
│ ├── chats.controller.js
│ └── chats.routes.js
│
├── config
│ └── index.js
│
├── constants
│ └── pagination.js
│
├── enums
│ └── enums.js
│
├── errors
│ ├── ApiErrors.js
│ ├── handleZodError.js
│ └── parsePrismaValidationError.js
│
├── helpars
│ ├── audioVideoCall.js
│ ├── fileUploader.js
│ ├── jwtHelpers.js
│ ├── paginationHelper.js
│ └── websocketSetUp.js
│
├── interfaces
│ ├── file.js
│ └── paginations.js
│
└── shared
├── calculateAge.js
├── calculateDistance.js
├── calculateFare.js
├── catchAsync.js
├── constants.js
├── cronForLicense.js
├── emailSender.js
├── findNearByDrivers.js
├── firebase.js
├── getTransactionId.js
├── html.js
├── pick.js
├── prisma.js
├── QueryBuilder.js
├── sendMessage.js
├── sendResponse.js
├── stripe.js
└── websocket.js

```






























## USER & AUTH Endpoints

| Name | Method | URL | Description |
|------|--------|-----|-------------|
| Create User / Register | POST | `/users/create-user/register` | Register a new user with role DRIVER, RIDER or ADMIN |
| Verify Login | POST | `/auth/verify-login` | Verify user login via OTP |
| Logout | POST | `/auth/logout` | Logout user |
| Resend OTP | POST | `/auth/resend-otp` | Resend OTP to phone number |
| Delete User | DELETE | `/users/delete-account/:userId` | Delete a user account by ID |
| Get User by ID | GET | `/users/get/:userId` | Fetch user details by ID |
| Google Login Driver | POST | `/auth/google-login-driver` | Login via Google for driver |
| Google Login Rider | POST | `/auth/google-login-rider` | Login via Google for rider |
| Current Location | PATCH | `/auth/current` | Update current location of user |
| Create Address | POST | `/auth/address` | Add address for user |
| Update Profile | PATCH | `/users/update-profile` | Update user profile info |
| Update License (Driver) | PATCH | `/users/upload-license` | Upload driver license images |
| Get Me Profile | GET | `/users/get-me` | Fetch own profile |
| Get All Users | GET | `/users/all?role=DRIVER` | List all users by role |
| Get All Users Count | GET | `/users/all-user-length` | Get total number of users |
| Get All Pending Driver | GET | `/users/drivers/pending` | Get pending driver list |
| Approve Pending Driver | PUT | `/users/drivers/approve` | Approve pending driver registration |
| Driver Onboarding | POST | `/users/driver/onboarding` | Upload driver profile and vehicle info |
| Get Driver Onboarding | GET | `/users/onboarding` | Get driver onboarding info |
| Set User Online | PATCH | `/users/toggle-online-status` | Toggle online status |
| Notification Toggle | PATCH | `/users/toggle-notification-status` | Toggle notification on/off |

## VEHICLE Endpoints

| Name | Method | URL | Description |
|------|--------|-----|-------------|
| Create Vehicle | POST | `/vehicle/create` | Create a new vehicle (Driver only). Use form-data with `data` JSON and `image` file. |
| Get All Vehicles | GET | `/vehicle/all` | Retrieve all vehicles (Driver only). Optional form-data for filtering/searching. |
| Get My Vehicles | GET | `/vehicle/my-vehicles?searchTerm=<term>` | Get vehicles of the logged-in driver. Optional `searchTerm` query parameter. |
| Get Vehicle By ID | GET | `/vehicle/single/:vehicleId` | Retrieve a single vehicle by its ID (Driver only). |
| Update Vehicle | PUT | `/vehicle/update/:vehicleId` | Update a vehicle (Driver only). Use form-data with `data` JSON, `image` file, and `vehicleId`. |

## PAYMENTS Endpoints

| Name | Method | URL | Description |
|------|--------|-----|-------------|
| Create New Card | POST | `/payments/create-card` | Add a new payment card for the logged-in rider. Include `payment_method` and `isDefault` in body. |
| Get Saved Cards | GET | `/payments/saved-cards` | Retrieve all saved cards of the logged-in rider. |
| Create Card Payment | POST | `/payments/card-payment` | Make a payment using a saved card or setup a new card for a ride/parcel. Include `transportId`, `paymentMethod`, and optionally `cardId`. |
| Create Cash Payment | POST | `/payments/create-payment` | Make a payment using cash. Include `transportId` and `paymentMethod` as `CASH`. |
| Create Wallet Payment | POST | `/payments/wallet-payment` | Pay from wallet balance. Include `transportId` and `paymentMethod` as `WALLET`. |
| Get My Payments | GET | `/payments/get-payments?status=<status>` | Get all payments of the logged-in user (driver/rider). Optional query parameter `status` (e.g., `COMPLETED`). |
| Get All Transactions by Admin | GET | `/payments/transactions` | Admin only. Retrieve all transactions. Optional query params: `isCourierFeeRelease`, `limit`. |
| Refund Payment | POST | `/payments/refund/:paymentId` | Admin can refund a specific payment. Include `reason` in body. |
| Get Refunded Payments | GET | `/payments/refunded-payments` | Retrieve refunded payments for rider/driver. Include `transportId`, `paymentMethod`, optionally `cardId`. |
| Create Stripe Account | POST | `/payments/create-stripe-account` | Driver can create a Stripe account for payment processing. |

## FARE MANAGEMENT Endpoints

| Name | Method | URL | Description |
|------|--------|-----|-------------|
| See Current Fare | GET | `/fares/current` | Retrieve the current fare rates. Accessible by driver, rider, or admin. |
| All Fare | GET | `/fares/` | Get all fare records. Admin access. |
| All Fare History | GET | `/fares/history` | Get history of all fare changes. Admin access. |
| Create Current Fare | POST | `/fares/` | Create a new fare rate. Include `costPerKm`, `costPerMin`, and `minimumFare` in body. Admin only. |
| Update Current Fare | PATCH | `/fares/:fareId` | Update an existing fare by ID. Include the updated fields in body (e.g., `minimumFare`). Admin only. |

## CHAT IMAGE Endpoints

| Name | Method | URL | Description |
|------|--------|-----|-------------|
| Image Request | POST | `/chats/upload-images` | Upload images in chat. Supports multiple images. Accessible by rider or driver. |

## Car Transport APIs

| Name | Method | URL | Description |
|------|--------|-----|-------------|
| Book a Ride | POST | `/car-transport/book` | Rider can book a ride. Include pickup, drop location, and vehicle type in the body. |
| Get Available Rides | GET | `/car-transport/available` | Rider can see available drivers nearby. |
| Get My Rides | GET | `/car-transport/my-rides` | Rider can see all their current and past rides. |
| Get Ride Details | GET | `/car-transport/:rideId` | Get details of a specific ride by ID. |
| Accept Ride | PATCH | `/car-transport/:rideId/accept` | Driver accepts a ride request. |
| Complete Ride | PATCH | `/car-transport/:rideId/complete` | Driver marks the ride as completed. |
| Cancel Ride | PATCH | `/car-transport/:rideId/cancel` | Rider or driver cancels the ride. |
| Get Nearby Drivers | GET | `/car-transport/nearby-drivers` | Rider can fetch drivers within a certain radius. |
| Update Vehicle Status | PATCH | `/car-transport/vehicle/:vehicleId/status` | Driver updates the availability status of their vehicle. Admin can also update. |
| Ride History | GET | `/car-transport/history` | Rider/Driver can view past rides. Admin can view all rides. |
| Estimate Fare | POST | `/car-transport/estimate-fare` | Calculate estimated fare before booking a ride. Include distance, time, and vehicle type in body. |
| Rate Ride | POST | `/car-transport/:rideId/rate` | Rider and driver can submit reviews and ratings after ride completion. |
| Admin All Rides | GET | `/car-transport/all` | Admin can view all rides in the system. |

## Notifications API Endpoints

| Name             | Method | URL                          | Description                              |
|----------------------------|--------|-----------------------------|------------------------------------------|
| Send Notification          | POST   | `/notifications/send`       | Send a notification to a user.           |
| Save Notification          | POST   | `/notifications/save`       | Save a notification record without sending it. |
| Get My Notifications       | GET    | `/notifications/get`        | Retrieve notifications for the authenticated user. |
| Get All Notifications      | GET    | `/notifications/`           | Retrieve all notifications. Admin only. |
| Read Notifications         | PUT    | `/notifications/read`       | Mark notifications as read.              |
| Delete Notification By ID  | DELETE | `/notifications/delete/:id` | Delete a notification by its ID.         |

## Reviews API Endpoints

| Endpoint Name                    | Method | URL                        | Description                                               |
|---------------------------------|--------|---------------------------|-----------------------------------------------------------|
| Create Review                    | POST   | `/reviews/create`         | Submit a review for a ride or service.                   |
| Get My Reviews                   | GET    | `/reviews/my-reviews`     | Retrieve reviews submitted by the authenticated user.    |
| Get Flagged/Bad Reviews (Admin) | GET    | `/reviews/flagged`        | Admin-only endpoint to get all flagged or bad reviews.   |

## Estimate Fare API Endpoints

| Endpoint Name             | Method | URL                           | Description                                      |
|----------------------------|--------|-------------------------------|--------------------------------------------------|
| Create Fare Estimate       | POST   | `/estimateFares/calculate-fare` | Rider can create a fare estimate for a ride.    |
| Get My Estimate List       | GET    | `/estimateFares/getMyEstimatelist` | Retrieve a list of fare estimates by the authenticated rider. |

## Licenses:

//add this section later

## Happy Coding



