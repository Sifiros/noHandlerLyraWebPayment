'use strict';

let getMakeCredentialsChallenge = (formBody) => {
    return fetch('/webauthn/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formBody)
    })
        .then((response) => response.json())
        .then((response) => {
            if (response.status !== 'ok')
                throw new Error(`Server responed with error. The message is: ${response.message}`);

            return response
        })
}

let sendWebAuthnResponse = (body) => {
    return fetch('/webauthn/response', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
        .then((response) => response.json())
        .then((response) => {
            console.log(response)
            if (response.status !== 'ok')
                throw new Error(`Server responed with error. The message is: ${response.message}`);

            return response
        })
}

//
// Username is credit card number and password is date (testing phase)
//

$('#card-form').submit(function (event) {
    event.preventDefault();

    let cc_number = this.number.value;
    let expDate = this.expDate.value;
    let name = "testFakeHolder";

    // let username = this.username.value;
    // let password = this.password.value;

    if (!cc_number || !name || !expDate) {
        console.log('Name , cc_number or expDate is missing!')
        return
    }

    getMakeCredentialsChallenge({ cc_number, name, expDate })
        .then((response) => {
            let publicKey = preformatMakeCredReq(response);
            return navigator.credentials.create({ publicKey })
        })
        .then((response) => {
            let makeCredResponse = publicKeyCredentialToJSON(response);
            console.log(makeCredResponse)
            makeCredResponse.isLoginAuthType = false;
            return sendWebAuthnResponse(makeCredResponse)
        })
        .then((response) => {
            if (response.status === 'ok') {
                console.log("success")
                alert("registration successful !")
                window.location.replace("http://localhost:8080")
            } else {
                console.log(`Server responed with error. The message is: ${response.message}`);
            }
        })
        .catch((error) => console.log(error))
})

let getGetAssertionChallenge = (formBody) => {
    console.log(formBody);
    return fetch('/webauthn/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formBody)
    })
        .then((response) => response.json())
        .then((response) => {
            if (response.status !== 'ok')
                throw new Error(`Server responed with error. The message is: ${response.message}`);

            return response
        })
}

//
//   Username is cc-number and password is exp date (testing)
//

function showPaymentSuccess() {
    $('#header_payment').hide()
    
    $('#card-register-main').hide()
    $('#success_pay').show()


    $('#footer_success').show()
    $('#footer_payment').hide()

}

$('#payment-form').submit(function (event) {
    event.preventDefault();

    // let username = this.username.value;
    // let password = this.password.value;

    let cvv = this.cvv.value;
    let cc_number = this.number.value;
    let expDate = this.expDate.value;

    if (!cvv || !cc_number || !expDate) {
        console.log("Missing cc-number or cvv or expiration date");
    }

    console.log(cvv);
    console.log(cc_number);
    console.log(expDate);

    getGetAssertionChallenge({ cc_number, expDate, cvv })
        .then((response) => {
            console.log(response)
            let publicKey = preformatGetAssertReq(response);
            return navigator.credentials.get({ publicKey })
        })
        .then((response) => {
            // easiest solution found to make double factor auth and not 2 steps auth
            let getAssertionResponse = publicKeyCredentialToJSON(response);
            getAssertionResponse.usernameToTest = cc_number;
            getAssertionResponse.passwordToTest = expDate;
            getAssertionResponse.isLoginAuthType = true;
            return sendWebAuthnResponse(getAssertionResponse)
        })
        .then((response) => {
            if (response.status === 'ok') {
                console.log("success")
                showPaymentSuccess()
            } else {
                console.log(`Server responed with error. The message is: ${response.message}`);
            }
        })
        .catch((error) => console.log(error))
})