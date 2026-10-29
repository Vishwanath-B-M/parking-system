# 🚗 Smart Parking Management System

A web-based parking management system built with **Python (Flask)** and a vanilla **JavaScript** frontend, with an optional **ESP32** smart gate. Vehicles get a token on entry, pick a slot on a live parking map, follow a drawn route to it, and are billed automatically on exit.

> Built with the help of AI coding assistants.

<!-- Add a screenshot here, e.g. ![Parking map](screenshots/map.png) -->

## Features

- **Token-based entry:** generates a token for each vehicle and opens the smart gate.
- **Live slot map:** six slots (A1 to A6) shown as available (green) or occupied (red).
- **Route navigation:** an SVG route is drawn from the gate to the selected slot, and back to the gate on exit.
- **Parking confirmation:** the driver confirms the actual parked slot. If this isn't done within 2 minutes of entry, a ₹100 fine is added.
- **Automatic billing:** the charge is calculated on the server from the parking duration, plus any fine.
- **Smart gate control:** the Flask server sends an HTTP request to an ESP32 to open the gate on entry and exit. The app still works if the ESP32 is not connected.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Python, Flask, `requests` |
| Frontend | HTML5, CSS3, JavaScript (vanilla), SVG |
| Hardware | ESP32 (HTTP gate endpoint) |

## Project Structure

```
parking-system/
├── app.py
├── requirements.txt
├── templates/
│   └── index.html
└── static/
    ├── script.js
    └── style.css
```

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/Vishwanath-B-M/parking-system.git
   cd parking-system
   ```

2. (Optional) Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate      # Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Set your ESP32 address in `app.py` (skip this if you have no hardware):

   ```python
   ESP32_IP = "10.10.59.148"   # change to your ESP32's IP
   ```

5. Run the app:

   ```bash
   python app.py
   ```

6. Open <http://localhost:5001> in your browser.

## How It Works

1. Click **Enter Parking** to get a token. The server calls the ESP32 to open the gate.
2. Click a green slot to see the route, then drive to it.
3. Click **Confirm Vehicle Parked** to start the parking timer.
4. To leave, enter your token and click **Start Exit Navigation**, then **Confirm Vehicle Reached Exit** at the gate. The bill is shown and the slot is freed.

## Billing Rules

| Item | Rule |
| --- | --- |
| Base charge | ₹20 for the first 60 minutes |
| Extra time | ₹10 for each additional hour or part of an hour |
| Fine | ₹100 if parking is not confirmed within 2 minutes of entry |

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | Parking map page |
| POST | `/entry` | Generate a token and open the gate (fails if parking is full) |
| POST | `/select_slot` | Confirm a token's parked slot |
| POST | `/add_fine` | Add the ₹100 confirmation-timeout fine |
| POST | `/exit` | Calculate duration, charge, fine and total bill |
| POST | `/complete_exit` | Free the slot and remove the token |
| POST | `/open_exit_gate` | Open the gate through the ESP32 |

## ESP32 Gate

The server sends a `GET` request to `http://<ESP32_IP>/gate`. Your ESP32 firmware needs to expose that route and open the gate when it is called.

## Known Limitations and Future Work

- Slot and token data is stored in memory, so it resets when the server restarts. Planned: move it to SQLite or MongoDB.
- The 2-minute fine timer runs in the browser. Planned: enforce it on the server.
- No authentication on the API endpoints.
- Tokens are random 4-digit numbers without a uniqueness check.
- No automated tests yet. Planned: pytest tests for billing and slot logic.

## Author

**Vishwanath Basavaraj Mirji**
GitHub: [@Vishwanath-B-M](https://github.com/Vishwanath-B-M)
