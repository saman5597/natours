/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (name ,email, password, passwordConfirm) => {
  try { 
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,  
        email,
        password,
        passwordConfirm
      }
    });

    if(res.status === 201){
      showAlert('success','Signed up successfully!!!');
      window.setTimeout(()=>{
        location.assign('/')
      },1000);
    }
  } catch (err) {
    showAlert('error',err.response.data.message);
  }
};


