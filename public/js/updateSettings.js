/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

// Type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try { 
    const url =
      type === 'password'
        ? '/api/v1/users/changePassword'
        : '/api/v1/users/updateMyProfile';

    const res = await axios({
      method: 'PATCH',
      url,
      data
    });
    if(res.status === 200){
      showAlert('success',res.data.message);
      window.setTimeout(()=>{
        location.assign('/me')
      },1000);
    }
  } catch (err) {
    showAlert('error',err.response.data.message);
  }
};