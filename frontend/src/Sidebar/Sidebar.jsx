import React from "react";
import { useHistory } from "react-router-dom";

import { Auth } from "aws-amplify";

import "./Sidebar.scss";

export default function Sidebar({ userData }) {
  let history = useHistory();

  async function signOut() {
    try {
      await Auth.signOut();
      console.log("you've been signed out");
      history.push("/");
      window.location.reload();
    } catch (error) {
      console.log("error signing out: ", error);
    }
  }

  // function displayUserData() {
  //   if (!userData) {
  //     return null;
  //   }
  //   return (
  //     <div className="user-data">
  //       <p>username: {userData.username}</p>
  //       <p>email: {userData.attributes.email}</p>
  //     </div>
  //   );
  // }

  return (
    <div className="sidebar">
      {/* {displayUserData()} */}
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}
