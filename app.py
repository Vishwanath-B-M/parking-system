from flask import Flask, render_template, request, jsonify
import random
import time
import requests

app = Flask(__name__)

# =========================================
# ESP32 CONFIG
# =========================================

ESP32_IP = "10.10.59.148"

GATE_URL = f"http://{ESP32_IP}/gate"

# =========================================
# PARKING SLOTS
# =========================================

slots = {

    "A1": None,
    "A2": None,
    "A3": None,
    "A4": None,
    "A5": None,
    "A6": None

}

# =========================================
# PARKING DATA
# =========================================

parking_data = {}

# =========================================
# TOKEN GENERATOR
# =========================================

def generate_token():

    return "T" + str(random.randint(1000, 9999))

# =========================================
# HOME PAGE
# =========================================

@app.route('/')
def home():

    return render_template(

        'index.html',

        slots=slots

    )

# =========================================
# ENTRY
# =========================================

@app.route('/entry', methods=['POST'])
def entry():

    available_slots = [

        slot for slot, value in slots.items()

        if value is None

    ]

    if len(available_slots) == 0:

        return jsonify({

            "success": False,

            "message": "Parking Full"

        })

    # =========================================
    # OPEN SMART GATE
    # =========================================

    try:

        requests.get(GATE_URL)

        print("Gate Opened")

    except:

        print("ESP32 Not Connected")

    token = generate_token()

    parking_data[token] = {

        "slot": None,

        "entry_time": None,

        "fine": 0,

        "confirmed": False

    }

    return jsonify({

        "success": True,

        "token": token

    })

# =========================================
# SELECT SLOT
# =========================================

@app.route('/select_slot', methods=['POST'])
def select_slot():

    data = request.json

    token = data.get('token')

    slot = data.get('slot')

    # =========================================
    # INVALID TOKEN
    # =========================================

    if token not in parking_data:

        return jsonify({

            "success": False,

            "message": "Invalid Token"

        })

    # =========================================
    # SLOT NOT SELECTED
    # =========================================

    if slot is None:

        return jsonify({

            "success": False,

            "message": "Please Select Slot First"

        })

    # =========================================
    # INVALID SLOT
    # =========================================

    if slot not in slots:

        return jsonify({

            "success": False,

            "message": "Invalid Slot"

        })

    # =========================================
    # SLOT AVAILABLE
    # =========================================

    if slots[slot] is None:

        slots[slot] = token

        parking_data[token]['slot'] = slot

        parking_data[token]['entry_time'] = time.time()

        parking_data[token]['confirmed'] = True

        return jsonify({

            "success": True

        })

    # =========================================
    # SLOT OCCUPIED
    # =========================================

    return jsonify({

        "success": False,

        "message": "Slot Occupied"

    })

# =========================================
# ADD FINE
# =========================================

@app.route('/add_fine', methods=['POST'])
def add_fine():

    token = request.json['token']

    if token in parking_data:

        parking_data[token]['fine'] = 100

        return jsonify({

            "success": True

        })

    return jsonify({

        "success": False

    })

# =========================================
# EXIT
# =========================================

@app.route('/exit', methods=['POST'])
def exit_vehicle():

    token = request.json['token']

    # =========================================
    # INVALID TOKEN
    # =========================================

    if token not in parking_data:

        return jsonify({

            "success": False,

            "message": "Invalid Token"

        })

    # =========================================
    # VEHICLE DATA
    # =========================================

    vehicle_data = parking_data[token]

    slot = vehicle_data.get('slot')

    entry_time = vehicle_data.get('entry_time')

    fine = vehicle_data.get('fine', 0)

    confirmed = vehicle_data.get('confirmed', False)

    # =========================================
    # UNCONFIRMED VEHICLE
    # =========================================

    if confirmed == False or entry_time is None:

        total_bill = fine

        return jsonify({

            "success": True,

            "duration": 0,

            "bill": 0,

            "fine": fine,

            "total_bill": total_bill,

            "slot": "Not Parked"

        })

    # =========================================
    # TIME CALCULATION
    # =========================================

    current_time = time.time()

    duration_seconds = current_time - entry_time

    duration_minutes = max(

        1,

        int(duration_seconds // 60)

    )

    # =========================================
    # BILL CALCULATION
    # =========================================

    if duration_minutes <= 60:

        bill = 20

    else:

        extra_hours = (

            (duration_minutes - 60) // 60

        ) + 1

        bill = 20 + (extra_hours * 10)

    total_bill = bill + fine

    # =========================================
    # RESPONSE
    # =========================================

    return jsonify({

        "success": True,

        "duration": duration_minutes,

        "bill": bill,

        "fine": fine,

        "total_bill": total_bill,

        "slot": slot

    })

# =========================================
# COMPLETE EXIT
# =========================================

@app.route('/complete_exit', methods=['POST'])
def complete_exit():

    token = request.json['token']

    if token in parking_data:

        slot = parking_data[token]['slot']

        if slot in slots:

            slots[slot] = None

        del parking_data[token]

        return jsonify({

            "success": True

        })

    return jsonify({

        "success": False

    })

# =========================================
# OPEN EXIT GATE
# =========================================

@app.route('/open_exit_gate', methods=['POST'])
def open_exit_gate():

    try:

        requests.get(GATE_URL)

        print("Gate Opened")

        return jsonify({

            "success": True

        })

    except:

        return jsonify({

            "success": False

        })

# =========================================
# RUN APP
# =========================================

if __name__ == '__main__':

    app.run(

        debug=True,

        host='0.0.0.0',

        port=5001

    )