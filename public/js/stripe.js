/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe('pk_test_4LtO94cwfsQXagwMZyiT8Wlc00SV9LM6tX');

export const bookTour = async tourId => {
    try{
        // 1) Get checkout session from the API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
        // 2) Use stripe obj to create checkout form + charge credit card for us
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
    } catch(err) {
        console.log(err);
        showAlert('error',err);
    }
};