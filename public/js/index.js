/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { signup } from './signup'
import { login , logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

console.log('Bundle.js');

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const signupForm = document.querySelector('#signupForm');
const loginForm = document.querySelector('#loginForm');
const logoutBtn = document.querySelector('#logout');
const updateDataForm = document.querySelector('#updateDataForm');
const updatePwdForm = document.querySelector('#updatePwdForm');
const bookTourBtn = document.querySelector('#bookTour');


//DELEGATION
if(mapBox){
    const locations = JSON.parse(mapBox.dataset.locations);
    // console.log(locations);
    displayMap(locations);
}

if(signupForm){
    signupForm.addEventListener('submit', async e => {
        e.preventDefault();
        document.querySelector('.btn--save-signup').innerHTML = "Please wait...";
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        await signup( name, email, password, passwordConfirm );
        document.querySelector('.btn--save-signup').innerHTML = "Sign up";
    });
}

if(loginForm){
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        document.querySelector('.btn--save-login').innerHTML = "Please wait...";
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        await login( email, password );
        document.querySelector('.btn--save-login').innerHTML = "Login";
    });
}

if(logoutBtn){
    logoutBtn.addEventListener('click', () => {
        logout();
    });
}

if(updateDataForm){
    updateDataForm.addEventListener('submit', async e => {
        e.preventDefault();
        document.querySelector('.btn--save-data').innerHTML = 'Updating...';
        const form = new FormData();
        form.append('name',document.getElementById('name').value);
        form.append('email',document.getElementById('email').value);
        form.append('photo',document.getElementById('photo').files[0]);
        await updateSettings(form,'data');
        document.querySelector('.btn--save-data').innerHTML = 'Save Settings';
    });
}

if(updatePwdForm){
    updatePwdForm.addEventListener('submit', async e => {
        e.preventDefault();
        document.querySelector('.btn--save-password').innerHTML = 'Updating...';
        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        await updateSettings({ passwordCurrent, password, passwordConfirm },'password');
        document.querySelector('.btn--save-password').innerHTML = 'Save Password';
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    });
}

if(bookTourBtn){
    bookTourBtn.addEventListener('click', async e => {
        e.target.innerHTML = 'Processing...';
        const tourId = e.target.dataset.tourId;
        await bookTour(tourId);
        e.target.innerHTML = 'Book tour now!';
    })
}