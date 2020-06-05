// function deleteVersion(versionId) {
//   axios
//     .post(
//       `${REST_API_URL}/delete-version`,
//       { diagramId, versionId },
//       {
//         headers: {
//           Authorization: userCredentials.accessToken.jwtToken,
//         },
//       }
//     )
//     .then(refreshList)
//     .catch((e) => console.log(`Could not delete version:`, e.response.data));
// }
// function deleteDiagram() {
//   axios
//     .post(
//       `${REST_API_URL}/delete-diagram`,
//       { diagramId },
//       {
//         headers: {
//           Authorization: userCredentials.accessToken.jwtToken,
//         },
//       }
//     )
//     .then(refreshList)
//     .catch((e) => console.log(`Could not delete diagram:`, e.response.data));
// }

// function displayVersions(versions) {
//   if (!versions || versions.length === 1) {
//     return null;
//   }
//   const versionElements = versions.slice(1).map((version) => {
//     const { versionId, versionName, lastModified } = version;
//     return (
//       <li key={`${diagramId}-${versionId}`} className="version-item">
//         <Link to={`/diagrams/${diagramId}/${versionId}`}>
//           <span className="version-name">{versionName}</span>
//           <span className="last-modified">
//             {window.moment(lastModified).format("DD MMM YYYY - HH:mm:ss")}
//           </span>
//         </Link>
//         <button onClick={(e) => deleteVersion(versionId)}>
//           Delete version
//         </button>
//       </li>
//     );
//   });

//   return (
//     <div className="version-list-container">
//       <p className="version-id">Versions: </p>
//       <ul className="versions">{versionElements}</ul>
//     </div>
//   );
// }

{
  /* <button onClick={deleteDiagram}>Delete diagram</button> */
}

{
  /* <Link to={`/diagrams/${diagramId}/${latestVersionId}`}>
        <h3 className="title">{diagramName}</h3>
      </Link> */
}
