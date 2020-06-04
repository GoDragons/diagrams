import React, { useState, useEffect } from "react";

import axios from "axios";
import { REST_API_URL } from "common/constants";
import { withRouter } from "react-router-dom";

import "./DiagramDetails.scss";

export function DiagramDetails({ userCredentials, userData, match }) {
  const [infoRequested, setInfoRequested] = useState(false);
  console.log("loaded");
  useEffect(() => {
    if (!infoRequested) {
      console.log("here");
      setInfoRequested(true);
      getDiagramDetails();
    }
  }, [infoRequested]);

  function getDiagramDetails() {
    return axios
      .get(
        `${REST_API_URL}/get-diagram/${match.params.diagramId}/${match.params.versionId}`,
        {
          headers: {
            Authorization: userCredentials.accessToken.jwtToken,
          },
        }
      )
      .then((response) => {
        console.log("diagramDetails:", response.data);
      })
      .catch((e) => console.log(`Could not get diagrams:`, e));
  }

  return <p>DiagramDetails</p>;
}

export default withRouter(DiagramDetails);
