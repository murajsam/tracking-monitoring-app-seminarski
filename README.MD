# Tracking Monitoring App

This is a web application that allows users to upload tracking data from excel files (examples can be found in `excel examples` folder) and view it in a user-friendly interface. The application is built using MERN stack (MongoDB, Express.js, React.js, and Node.js) and uses the `xlsx` and `node-xlsx` libraries to read from Excel files. Database stores tracking data from 3 different carriers: DHL, Hellman, and Logwin. Tracking data is stored in predefined format by performing specific mapping rules for each carrier. Mapping rules can be found in `mapping.csv` file.

The application also has user authentication (registration and login with JWT tokens) and two roles: a regular **user** who uploads Excel files and sees all shipments, and a **carrier** who cannot upload and sees only the shipments of his own carrier (DHL, Hellman or Logwin).

## Features

- User registration and login (JWT token, passwords hashed with bcrypt)
- Two roles: `user` (uploads files, sees all shipments) and `carrier` (sees only its own carrier's shipments, cannot upload)
- Protected routes on both frontend (React route guard) and backend (auth middleware)
- Upload tracking data from Excel files (.xlsx, .xls)
- Validate tracking data and import it into MongoDB Atlas cloud database (DHL, Hellman, Logwin)
- Upload history of Excel files in MongoDB Atlas cloud database
- Error handling for failed validation
- View tracking data in a user-friendly interface
- Filter tracking data based on carrier, status, shipper, weight, date range, and search (filters are dynamic and change as more filters are selected based on the data)
- Display detailed information for each tracking
- Mobile view support (responsive design)

## Mapping Rules Solution

To map tracking data for carriers (`DHL`, `Hellman`, `Logwin`) based on predefined rules from `mapping.csv` file, step-by-step approach was used:

1. **Carrier Definitions**:

   - An array of carriers is defined, where each carrier (`DHL`, `Hellman`, `Logwin`) has a name and an array of specific field names. These field names represent the expected structure of data in the Excel files.

2. **Converting Excel Files to JSON**:

   - The `xlsx` library is used to read the uploaded Excel file. Each sheet in the file is processed, converting the data into a JSON object.
   - This JSON object represents the rows of the Excel file as an array of objects, where each object value corresponds to a row value, and the keys represent the column headers of the Excel file.

3. **Carrier Matching**:

   - The application iterates through the JSON objects (rows) from excel file to determine if the data matches one of the carriers.
   - A match is identified when all field names from the carrier definition align with the key or value pairs in the JSON objects.
   - Each sheet in the Excel file is checked, and the process stops when the first matching carrier is found.

4. **Field Mapping**:

   - Once a matching carrier is identified, a new array of objects is created. Each object contains key-value pairs where:
     - **Key**: Field name from the carrier definition.
     - **Value**: The corresponding value from the Excel file for that field.
   - Special handling is applied for date fields and other data transformations, ensuring the data is correctly formatted.

5. **Applying Mapping Rules**:

   - Then array is processed again using predefined mapping rules from the `mapping.csv` file.
   - A `switch` statement is used to handle mapping rules and specific transformations for each carrier. For example:
     - Adjustments for date formats and time zones.
     - Weight conversions or other carrier-specific field mappings.

6. **Final Output**:
   - The final mapped data is returned along with the identified carrier’s name. This data is then passed to the backend for storage in the database.

## Pages

The application has five pages:

1. **Login / Register Pages**:
   These pages are public. On the register page the user picks a username, a password and a role (`user` or `carrier`). If the role is `carrier`, one of the carriers (DHL, Hellman, Logwin) must be selected. After login/registration the user gets a JWT token and is redirected into the application. All other pages require the user to be logged in.

2. **Upload Page / Home Page**:
   This page allows users to upload Excel files containing tracking data. Only the role `user` can open this page (a carrier is redirected to the overview). There are three steps in the upload process: File Upload, Validation, and Import. The user can see the progress of each step. On the first step, the user can select multiple files at once or drag and drop files into the page and can also delete or add more files. On the second step, the user can no longer add or delete files. Lastly, on the third step, the files are being validated and tracking data is being imported into the database. Once the import is complete, the user can see the results of the imported files (each file shows the indentified carrier, number of imported rows, duplicated rows, and success rate).

3. **Overview Page**:
   This page displays a table of all imported tracking data from files. A `user` sees the shipments of all carriers, while a `carrier` sees only the shipments of his own carrier. The user can filter the data based on carrier, status, shipper, weight, date range, and search. The table also provides links to the Detail Page for each tracking.

4. **Detail Page**:
   This page displays detailed information for a selected tracking. The user can see the file name, carrier, status, and additional information. The user can also see the tracking data in a table format. A carrier can open details only of his own shipments.

## Backend API

The backend API is a Node.js application that handles the file upload and import. It uses the `xlsx` and `node-xlsx` libraries to read Excel files.

The API exposes these endpoints:

- `POST /api/auth/register`: Registers a new user (username, password, role and carrier if the role is `carrier`). Returns a JWT token and the user data.

- `POST /api/auth/login`: Logs in an existing user. Returns a JWT token and the user data.

- `POST /api/files/upload`: This endpoint is used to upload Excel file and store it and it's tracking data in the database. Requires a logged-in user with role `user` (a carrier gets 403).

- `GET /api/trackings/:id`: This endpoint is used to retrieve tracking data for a specific tracking. It accepts a parameter `:id` representing the tracking ID. The API returns the tracking data in JSON format. A carrier can get only his own carrier's shipment.

- `GET /api/trackings/all`: This endpoint is used to retrieve all tracking data. It returns a JSON array of tracking data. For a carrier the list is filtered to his own carrier only.

All `/api/files` and `/api/trackings` routes require the header `Authorization: Bearer <token>` (the token is received on login/registration).

## How to Run the Application

To deploy the application, you need to have Node.js and npm installed on your system. Once you have them installed, follow these steps:

1. Clone the repository to your local machine.

2. Navigate to the `backend` directory and install the dependencies by running `npm install`.

3. Navigate to the `frontend` directory and install the dependencies by running `npm install`.

4. In the `backend` directory create a `.env` file (there is an example in `.env.example`) with `PORT`, `MONGO_URI` (local MongoDB or MongoDB Atlas connection string) and `JWT_SECRET`.

5. (Optional) Run `node seed_users.mjs` in the `backend` directory to create demo accounts:

   | Username       | Password     | Role    | Carrier |
   | -------------- | ------------ | ------- | ------- |
   | `djordje`      | `djordje123` | user    | -       |
   | `dhl_user`     | `dhl123`     | carrier | DHL     |
   | `hellman_user` | `hellman123` | carrier | Hellman |
   | `logwin_user`  | `logwin123`  | carrier | Logwin  |

6. Start the backend API by running `npm run dev` in the `backend` directory.

7. Start the frontend application by running `npm start` in the `frontend` directory (it opens on `http://localhost:3000`).

## Screenshots

**Login page**

![Login](screenshots-app/01-login.png)

**Register page (choosing the carrier role)**

![Register](screenshots-app/02-register.png)

**Upload page - start (role: user)**

![Upload empty](screenshots-app/03-upload-empty.png)

**Upload page - selected files**

![Upload files](screenshots-app/04-upload-files.png)

**Upload page - validation step**

![Upload validate](screenshots-app/05-upload-validate.png)

**Upload page - importing (loading)**

![Upload loading](screenshots-app/06-upload-loading.png)

**Upload page - import results**

![Upload result](screenshots-app/07-upload-result.png)

**Upload page - additional information for a file**

![Upload additional info](screenshots-app/08-upload-additional.png)

**Overview page - role `user` sees all carriers**

![Overview user](screenshots-app/09-overview-user.png)

**Overview page - search**

![Overview search](screenshots-app/10-overview-search.png)

**Overview page - advanced filters**

![Overview filters](screenshots-app/11-overview-filters.png)

**Detail page**

![Detail](screenshots-app/12-detail.png)

**Overview page - role `carrier` (DHL) sees only DHL shipments**

![Overview carrier](screenshots-app/13-overview-carrier-dhl.png)

## Contributing

Contributions are welcome! If you find any bugs or have suggestions for improvements, please open an issue or submit a pull request on the GitHub repository.
