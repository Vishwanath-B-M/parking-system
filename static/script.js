let currentToken = null;

let currentSlot = null;

let parkingTimeout = null;

window.exitData = null;

/* =========================================
   LOCAL STORAGE
========================================= */

let occupiedSlots =
JSON.parse(localStorage.getItem('occupiedSlots'))
|| {};

/* =========================================
   SLOT POSITIONS
========================================= */

const slotPositions = {

    "A1": { x:120, y:180 },

    "A2": { x:120, y:320 },

    "A3": { x:120, y:460 },

    "A4": { x:820, y:180 },

    "A5": { x:820, y:320 },

    "A6": { x:820, y:460 }

};

/* =========================================
   ON LOAD
========================================= */

window.onload = function(){

    restoreParkingState();

};

/* =========================================
   SAVE STATE
========================================= */

function saveState(){

    localStorage.setItem(

        'occupiedSlots',

        JSON.stringify(occupiedSlots)

    );

}

/* =========================================
   RESTORE STATE
========================================= */

function restoreParkingState(){

    for(let slot in occupiedSlots){

        let slotElement =
        document.getElementById(slot);

        if(slotElement){

            slotElement.classList.remove('available');

            slotElement.classList.add('occupied');

        }

    }

}

/* =========================================
   GENERATE TOKEN
========================================= */

function generateToken(){

    if(Object.keys(occupiedSlots).length >= 6){

        document.getElementById('directionText')
        .innerHTML =

        `
        🚫 Parking Full

        All Slots Occupied
        `;

        return;
    }

    fetch('/entry', {

        method:'POST'

    })

    .then(response => response.json())

    .then(data => {

        if(data.success == false){

            alert("Parking Full");

            return;

        }

        currentToken = data.token;

        currentSlot = null;

        document.getElementById('tokenText')
        .innerHTML =

        "Your Token: " + data.token;

        document.getElementById('directionText')
        .innerHTML =

        `
        🚧 Smart Gate Opened

        Please Select Parking Slot

        IMPORTANT:

        Confirm Parking Within 2 Minutes

        Otherwise ₹100 Fine Will Be Added
        `;

        /* =========================================
           TIMEOUT ENFORCEMENT
        ========================================= */

        parkingTimeout = setTimeout(() => {

            if(currentToken != null){

                fetch('/add_fine', {

                    method:'POST',

                    headers:{
                        'Content-Type':'application/json'
                    },

                    body:JSON.stringify({

                        token:currentToken

                    })

                });

                alert(

                    "⚠ Parking Confirmation Timeout!\n\n" +

                    "₹100 Fine Added.\n\n" +

                    "Please Confirm Actual Parked Slot."

                );

                document.getElementById('directionText')
                .innerHTML =

                `
                ⚠ Parking Confirmation Timeout

                ₹100 Fine Added

                Please Confirm
                Actual Parked Slot
                `;

                document.getElementById('confirmParkBtn')
                .style.display = 'inline-block';

            }

        }, 120000);

    });

}

/* =========================================
   SELECT SLOT
========================================= */

function selectSlot(slot){

    if(currentToken == null){

        alert("Generate Token First");

        return;
    }

    if(occupiedSlots[slot]){

        alert("Slot Occupied");

        return;
    }

    currentSlot = slot;

    drawPath(slot);

    document.getElementById('directionText')
    .innerHTML =

    `
    🛰 Navigation Started

    Follow Blue Route

    Proceed To Slot ${slot}

    If Parked,
    Click Confirm Vehicle Parked
    `;

    document.getElementById('confirmParkBtn')
    .style.display = 'inline-block';

}

/* =========================================
   CONFIRM PARKED
========================================= */

function confirmParked(){

    if(currentSlot == null){

        alert("Please Select Slot First");

        return;
    }

    fetch('/select_slot', {

        method:'POST',

        headers:{
            'Content-Type':'application/json'
        },

        body:JSON.stringify({

            token:currentToken,

            slot:currentSlot

        })

    })

    .then(response => response.json())

    .then(data => {

        if(data.success){

            clearTimeout(parkingTimeout);

            let slotElement =
            document.getElementById(currentSlot);

            slotElement.classList.remove('available');

            slotElement.classList.add('occupied');

            occupiedSlots[currentSlot] = {

                token: currentToken

            };

            saveState();

            document.getElementById('directionText')
            .innerHTML =

            `
            ✅ Vehicle Parked Successfully

            Actual Slot Confirmed

            Parking Timer Running

            Slot:
            ${currentSlot}
            `;

            document.getElementById('confirmParkBtn')
            .style.display = 'none';

            document.getElementById('routePath')
            .setAttribute('d', '');

            currentToken = null;

            currentSlot = null;

        }

        else{

            alert(data.message);

        }

    });

}

/* =========================================
   EXIT PARKING
========================================= */

function exitParking(){

    let token =
    document.getElementById('exitToken').value;

    if(token == ""){

        alert("Enter Token");

        return;
    }

    fetch('/exit', {

        method:'POST',

        headers:{
            'Content-Type':'application/json'
        },

        body:JSON.stringify({

            token:token

        })

    })

    .then(response => response.json())

    .then(data => {

        if(data.success == false){

            alert("Invalid Token");

            return;
        }

        window.exitData = data;

        currentSlot = data.slot;

        /* =========================================
           UNCONFIRMED VEHICLE
        ========================================= */

        if(data.slot == "Not Parked"){

            fetch('/open_exit_gate', {

                method:'POST'

            });

            document.getElementById('billSection')
            .innerHTML =

            `
            <h2>Billing Details</h2>

            <p>Parking Time:
            0 Minutes</p>

            <p>Parking Charge:
            ₹0</p>

            <p>Fine:
            ₹${data.fine}</p>

            <h2>Total Bill:
            ₹${data.total_bill}</h2>

            <h3>Vehicle Not Confirmed</h3>

            <h3>Smart Gate Opened</h3>
            `;

            document.getElementById('directionText')
            .innerHTML =

            `
            ⚠ Vehicle Exited

            Parking Was Never Confirmed

            Fine Applied Successfully
            `;

            /* COMPLETE EXIT */

            fetch('/complete_exit', {

                method:'POST',

                headers:{
                    'Content-Type':'application/json'
                },

                body:JSON.stringify({

                    token:token

                })

            });

            document.getElementById('exitToken').value = "";

            return;

        }

        /* =========================================
           EXIT NAVIGATION
        ========================================= */

        drawExitPath(currentSlot);

        document.getElementById('directionText')
        .innerHTML =

        `
        🛰 Exit Navigation Started

        Follow Blue Route

        Proceed To Smart Gate

        After Reaching Exit,
        Click Confirm Exit
        `;

        document.getElementById('confirmExitBtn')
        .style.display = 'inline-block';

    });

}

/* =========================================
   CONFIRM EXIT
========================================= */

function confirmExit(){

    let data = window.exitData;

    if(!data){

        alert("No Exit Data Found");

        return;
    }

    let token =
    document.getElementById('exitToken').value;

    /* =========================================
       OPEN SMART GATE
    ========================================= */

    fetch('/open_exit_gate', {

        method:'POST'

    });

    /* =========================================
       REMOVE SLOT FROM UI
    ========================================= */

    if(currentSlot && currentSlot != "Not Parked"){

        let slot =
        document.getElementById(currentSlot);

        if(slot){

            slot.classList.remove('occupied');

            slot.classList.add('available');

        }

        delete occupiedSlots[currentSlot];

        saveState();

    }

    /* =========================================
       COMPLETE EXIT
    ========================================= */

    fetch('/complete_exit', {

        method:'POST',

        headers:{
            'Content-Type':'application/json'
        },

        body:JSON.stringify({

            token:token

        })

    })

    .then(response => response.json())

    .then(result => {

        console.log(result);

    });

    /* =========================================
       BILLING UI
    ========================================= */

    document.getElementById('billSection')
    .innerHTML =

    `
    <h2>Billing Details</h2>

    <p>Parking Time:
    ${data.duration} Minutes</p>

    <p>Parking Charge:
    ₹${data.bill}</p>

    <p>Fine:
    ₹${data.fine}</p>

    <h2>Total Bill:
    ₹${data.total_bill}</h2>

    <h3>Payment Successful</h3>

    <h3>Smart Gate Opened</h3>
    `;

    document.getElementById('directionText')
    .innerHTML =

    `
    ✅ Exit Completed

    Vehicle Successfully Exited
    `;

    /* RESET UI */

    document.getElementById('routePath')
    .setAttribute('d', '');

    document.getElementById('confirmExitBtn')
    .style.display = 'none';

    document.getElementById('exitToken').value = "";

    document.getElementById('tokenText').innerHTML = "";

    currentSlot = null;

    currentToken = null;

    window.exitData = null;

}

/* =========================================
   DRAW ENTRY PATH
========================================= */

function drawPath(slot){

    let pos =
    slotPositions[slot];

    let path =
    `M 500 50
     L 500 ${pos.y}
     L ${pos.x} ${pos.y}`;

    document.getElementById('routePath')
    .setAttribute('d', path);

}

/* =========================================
   DRAW EXIT PATH
========================================= */

function drawExitPath(slot){

    let pos =
    slotPositions[slot];

    let path =
    `M ${pos.x} ${pos.y}
     L 500 ${pos.y}
     L 500 50`;

    document.getElementById('routePath')
    .setAttribute('d', path);

}