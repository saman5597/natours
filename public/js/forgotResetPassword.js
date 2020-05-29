/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const forgotPassword = async (email) => {
  try { 
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/forgotPassword',
      data: {
        email
      }
    });

    if(res.status === 200){
      showAlert('success','Email sent. Please check your email to reset your password.');
      window.setTimeout(()=>{
        location.reload(true)
      },1000);
    }
  } catch (err) {
    showAlert('error',err.response.data.message);
  }
};

export const resetPassword = async (password , passwordConfirm) => {
    try { 
      const urlParam = new URLSearchParams(window.location.search);  
      const rt = urlParam.get("rt")
      const res = await axios({
        method: 'PATCH',
        url: `/api/v1/users/resetPassword/${rt}`,
        data: {
          password,
          passwordConfirm
        }
      });
  
      if(res.status === 200){
        showAlert('success','Your password has been changed.');
        window.setTimeout(()=>{
            location.assign('/')
        },1000);
      }
    } catch (err) {
      showAlert('error',err.response.data.message);
    }
  };


