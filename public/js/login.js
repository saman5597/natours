/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try { 
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password
      }
    });

    if(res.status === 200){
      showAlert('success','Logged in successfully!!!');
      window.setTimeout(()=>{
        location.assign('/')
      },1000);
    }
  } catch (err) {
    showAlert('error',err.response.data.message);
  }
};

export const logout = async () => {
  try{
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });

    if(res.status === 200){
      showAlert('success','Logged out successfully!!!');
      window.setTimeout(()=>{
        location.reload(true)
      },1000);
    }
  } catch(err){
    console.log(err.response);
    showAlert('error','Error logging out! Please try again.')
  }
};


