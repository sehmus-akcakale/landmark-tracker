# Landmark Tracking System

This web application allows users to add landmarks on a map, visit them, and create visit plans. Users can track their landmark visits and organize future trips using an interactive map interface.

## Features

- Add landmarks by clicking on the map
- Assign name, description, and category to landmarks
- List and view landmarks
- Record landmark visits with notes and ratings
- View history of visited landmarks
- Create future visit plans

## Technologies

- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Frontend:** HTML, CSS, JavaScript, Leaflet.js (map)
- **Authentication:** JWT-based user authentication

## Installation

### Requirements

- Node.js (v14 or higher)
- MongoDB

### Steps

1. Clone the repository:

   ```
   git clone <repo-url>
   cd landmark-tracker
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start MongoDB (if you have a local installation):

   ```
   mongod
   ```

4. Start the application:

   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5000` or `https://landmark-tracker.onrender.com/`

## API Endpoints

### Authentication

- **POST /api/auth/register** - Register a new user

  - Body: `{ username, email, password }`
  - Returns: User object with JWT token

- **POST /api/auth/login** - Login an existing user
  - Body: `{ email, password }`
  - Returns: User object with JWT token

### Landmarks

- **GET /api/landmarks** - List all landmarks

  - Query parameters:
    - `name` - Filter by name (case-insensitive)
    - `category` - Filter by category
    - `description` - Filter by description (case-insensitive)
  - Returns: Array of landmark objects

- **GET /api/landmarks/:id** - Get a specific landmark

  - Returns: Landmark object

- **POST /api/landmarks** - Create a new landmark

  - Body:
    ```
    {
      "name": "Landmark Name",
      "location": {
        "latitude": "40.7128",
        "longitude": "-74.0060"
      },
      "description": "Landmark description",
      "category": "Historical"
    }
    ```
  - Returns: Created landmark object

- **PUT /api/landmarks/:id** - Update a landmark

  - Body: Can include any of the fields in POST
  - Returns: Updated landmark object

- **DELETE /api/landmarks/:id** - Delete a landmark
  - Returns: Success message

### Visit Records

- **POST /api/visited** - Record a landmark visit

  - Body:
    ```
    {
      "landmark_id": "landmark_id_here",
      "visitor_name": "John Doe", (optional)
      "notes": "Visit notes here",
      "visited_date": "2023-11-15T14:30:00Z",
      "rating": 5
    }
    ```
  - Returns: Visit record with populated landmark data

- **GET /api/visited** - List all visit records

  - Query parameters:
    - `date` - Filter by visit date
    - `visitor` - Filter by visitor name
    - `rating` - Filter by rating
  - Returns: Array of visit records with populated landmark data

- **GET /api/visited/landmark/:id** - Get all visits for a specific landmark

  - Returns: Array of visit records for the specified landmark

- **GET /api/visited/detail/:id** - Get details of a specific visit

  - Returns: Visit record with populated landmark data

- **PUT /api/visited/:id** - Update a visit record

  - Body: Can include any of the fields in POST
  - Returns: Updated visit record with populated landmark data

- **DELETE /api/visited/:id** - Delete a visit record
  - Returns: Success message

### Visit Plans

- **POST /api/visitplans** - Create a new visit plan

  - Body:
    ```
    {
      "name": "Weekend Trip",
      "planned_date": "2023-12-15T09:00:00Z",
      "landmarks": [
        {
          "landmark_id": "landmark_id_here",
          "order": 1,
          "notes": "Visit in the morning"
        },
        {
          "landmark_id": "another_landmark_id",
          "order": 2,
          "notes": "Visit in the afternoon"
        }
      ],
      "overall_notes": "Bring water and snacks"
    }
    ```
  - Returns: Created visit plan with populated landmark data

- **GET /api/visitplans** - List all visit plans

  - Returns: Array of visit plans with populated landmark data

- **GET /api/visitplans/:id** - Get a specific visit plan

  - Returns: Visit plan with populated landmark data

- **PUT /api/visitplans/:id** - Update a visit plan

  - Body: Can include any of the fields in POST
  - Returns: Updated visit plan with populated landmark data

- **DELETE /api/visitplans/:id** - Delete a visit plan
  - Returns: Success message

## Usage Guide

### Adding a Landmark

1. Log in to your account
2. Navigate to the map view
3. Click on a location on the map
4. Fill in the landmark details (name, description, category)
5. Click "Add Landmark"

### Recording a Visit

1. Navigate to the landmarks list
2. Find the landmark you visited
3. Click "Record Visit"
4. Enter visit details (date, notes, rating)
5. Submit the form

### Creating a Visit Plan

1. Navigate to the "Visit Plans" section
2. Click "Create New Plan"
3. Name your plan and choose a date
4. Select landmarks to include in your plan
5. Arrange them in the desired order
6. Add notes for each landmark
7. Click "Save Plan"

### Viewing Visit History

1. Navigate to the "Visited Landmarks" section
2. Browse through your past visits
3. Filter by date, landmark name, or rating

## Authentication

All API endpoints except for login and register require authentication. Include a JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token_here
```

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
