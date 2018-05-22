// CORS and CURD request configurations.
axios.defaults.baseURL = 'http://localhost:8081';

let headers = {};
function getHeaders() {
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Authentication': localStorage.getItem("authKey"),
        'ClientId': localStorage.getItem("uid")
    };

    return headers;
}

// for everything but seeing all food items, we need to have the authentication key in the API call.
// but every time a page is reloaded, bundle.js will run replace the baseURL to the one at line #1(which
// doesn't contain the authentication key).
// this is done to maintain the baseURL with authentication key included given that the client has already,
// being given an authentication key by the server.
if (localStorage.getItem('authKey') != undefined) {
    headers.Authentication = localStorage.getItem('authKey');
    headers.ClientId = localStorage.getItem('uid');
}

// re-directions.
$('#login-btn').click(function () {
    window.location.href = 'login.html';
});
$('#reg-btn').click(function () {
    window.location.href = 'reg.html';
});

/*
 * Initial executions. These happen right away when a page is loaded.
 */
$(document).ready(function () {
    let uid = localStorage.getItem("uid");

    // show login,logout and register buttons appropriately.
    if (uid == undefined) {
        $('#login-btn, #reg-btn').show();
        $('#logout-btn').hide();
    }
    else {
        $('#login-btn, #reg-btn').hide();
        $('#logout-btn').show();
        $('#logged-name').html(uid);
    }

    $('#billPayment').hide(); // credit/debit card payment radio button is going to be selected by default.

    axios.get('/food', { headers: getHeaders() })
        .then(response => {
            mapFoodResults(response.data, 'food-list', true);
        })
        .catch(reject => {
            console.log(reject);
        })
});

/*
 * Handling login.
 */
$('#login-btn-submit').click(function () {
    logMeIn();
});
function logMeIn() {
    // send credentials to the session API.
    let data = {
        email: $('#login-email').val(),
        password: $('#login-password').val()
    };

    axios.post('/user/authenticate', data, { headers: getHeaders() })
        .then(response => {
            let responseBody = response.data;

            if (responseBody.success == true) {
                // axios anyways store the response body in data. And the json reponse itself has a data attribute which contains the session.
                localStorage.setItem('authKey', responseBody.data.authKeyOfUid);
                localStorage.setItem('uid', responseBody.data.uid);

                // update the headers.
                headers.Authentication = localStorage.getItem('authKey');
                headers.ClientId = localStorage.getItem('uid');

                // hide the login and reg button and replace them with a logout button.
                $('#login-btn, #reg-btn').hide();
                $('#logout-btn').show();

                // redirection.
                window.location.href = 'home.html';
            }
        })
        .catch(reject => {
            console.log(reject);
        })
}

$('#logout-btn').click(function () {
   logMeOut();
});
function logMeOut() {
    // tell the server to invoke the authentication key.
    axios.delete('/user/invoke', { headers: getHeaders() })
        .then(response =>{
            console.log(response.data);
        })
        .catch(reject => {
            console.log(reject);
        })

    // clear all local storage variables(uid, authKeyOfUid, fid)
    localStorage.clear();

    // go back to homepage.
    window.location.href = 'home.html';
}

// when the buy button assigned to a certain food item is clicked.
// we need to store this on local storage so that all the proceeding pages,
// know which item is being purchased.
function buyThisFoodItem(fId) {
    localStorage.setItem('foodItem', fId);
    window.location.href = 'buy.html';
}

// for the buying page to show the details.
function showFoodAndUserDetails() {
    // populate payment form with user's known details.
    axios.get('http://localhost:8081/user/id/' + localStorage.getItem('uid'), { headers: getHeaders() })
        .then(response => {
            let user = response.data;

            $('#email').val(user.email);
            $('#mobile').val(user.mobileNumber);
            $('#name').val(user.name);
            $('#address').val(user.address);

            console.log(user);
        })
        .catch(reject => {

        });

    // get the details of the food item the user is buying.
    let fId = localStorage.getItem('foodItem');
    axios.get('/food/id/' + fId, { headers: getHeaders() })
        .then(response => {
            let entries = [];
            entries[0] = response.data;
            console.log(entries);
            mapFoodResults(entries, 'food-item', false);
        })
        .catch(rejection => {

        })
}

function makePayment() {

    let paymentType = $("input[name='paymentRadios']:checked").val();

    let data = {
        pid: 0,
        uid: localStorage.getItem('uid'),
        item: localStorage.getItem('foodItem'),
        paymentType: paymentType,
        paymentDate: new Date()≤
    };

    switch (paymentType) {
        case 'card':
            let cardDetails = {
                number: $('#card-number').val(),
                ccv: $('#ccv').val(),
                expiry: $('#exp-date').val()
            };
            data.paymentDetails = cardDetails;
            break;

        case 'bill':
            let billDetails = {
                handler: 'Dialog',
                mobile: $('#dialog-number').val(),
                pin: $('#pin').val()
            };
            data.paymentDetails = billDetails;
            break;
    }

    console.log(paymentType)
    console.log(data.paymentDetails);
    axios.post('/payment', data, { headers: getHeaders() })
        .then(response => {
            console.log(response.status);
        })
        .catch(reject => {

        });

}

// for home page to show all the food items.
function showFoodItems() {
    console.log(headers);
    axios.get('/food', { headers: getHeaders() })
        .then(response=> {
            let entries = response.data;
            mapFoodResults(entries, 'food-list', true);
        })
        .catch(rejection => {

        });
}

// show relevant food items as the user is typing.
$('#food-search').keypress(function () {
    let keyword = $('#food-search').val();

    // remove the current contents of the list first.
    $('#food-list').empty();

    console.log(getHeaders());
    axios.get('/food/' + keyword, { headers: getHeaders() })
        .then(response=> {
            let entries = response.data;
            mapFoodResults(entries, 'food-items', true);
        })
        .catch(rejection => {

        });
});


/*
 * Handling payment.
 */
function completePayment() {
    // collect information from the forms.
    // common details.
    let data = {

    }
    let paymentType = $('[name=paymentRadios]:checked').val();
    console.log(paymentType);
}

// show appropriate payment information form depending on which payment type is selected.
//      1) Credit/Debit Card radio -> cardPayment form
//      2) Add to Dialog Postpaid Bill radio -> billPayment form.
// always hide the irrelevant form.
$('#paymentRadiosCard').click(function () {
    $('#cardPayment').show();   $('#billPayment').hide();
});

$('#paymentRadiosBill').click(function () {
    $('#billPayment').show();   $('#cardPayment').hide();
});

// Food items retrieved by API call to /food will be mapped to the food-list UL.
// This can be used for showing all the food items in the db or just to show
// the,
// search results.

// @param entries
// json array containing food items.
function mapFoodResults(entries, targetHtmlTag, appendBtn) {
    entries.forEach(entry => {
    	// id of each list item element should be the food if of the food it
		// contains.
        let compositeHtmlElement =
	        '<li class="list-group-item d-flex justify-content-between align-items-center">' +
	        '<p>'+
	        '<b>' + entry.name + '<b/> <br /><small>' + entry.ingredients + '</small> <br />' +
	        '<span class="badge badge-primary badge-pill">Rs: ' + entry.price + '/=</span>' +
	        '</p>';
	        
        if (appendBtn) {
        	compositeHtmlElement += '<button id="' + entry.fId + '" type="button" class="btn btn-success" onclick="buyThisFoodItem(this.id)">Buy</button>';
        	// the reason why we append an underscore to the entry.fId's value is, since we give the same value as the id of the LI element,
            // buyThisFoodItem will get the LI element as a whole as the parameter if we directly pass the fId is its own id as well.
        }
        
        compositeHtmlElement += '</li>';
	        // when we call the onClick function, it will actually get the whole
			// <li> element as the parameter since,
	        // li element has the fId as its id.
        
        $('#' + targetHtmlTag).append(compositeHtmlElement);
    })
}

// POST the reg details to the server.
$('#reg-submit-btn').click(function () {

    let data = {
        "uid": 0,
        "name": $('#nameReg').val(),
        "email": $('#emailReg').val(),
        "address": $('#addressReg').val(),
        "password": $('#passwordReg').val(),
        "mobileNumber": $('#mobileReg').val()
    };

    // make sure to include uid attribute with 0 as its value.
    // otherwise the server will complain about a missing parameter.
    axios.post('/user', data, headers)
        .then(response => {
            window.location.href = 'login.html';
        })
        .catch(rejection => {
            // for some reason axios catch a rejection even when the,
            // server accepts the POST data.
            window.location.href = 'login.html';
        });

});
